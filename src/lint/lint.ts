/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import * as chalk from 'chalk';
import * as fs from 'mz/fs';
import * as path from 'path';
import * as logging from 'plylog';
import {Analysis, Analyzer, FSUrlLoader, PackageUrlResolver, Severity, Warning} from 'polymer-analyzer';
import {WarningFilter} from 'polymer-analyzer/lib/warning/warning-filter';
import {WarningPrinter} from 'polymer-analyzer/lib/warning/warning-printer';
import * as lintLib from 'polymer-linter';
import {applyEdits, Edit, FixableWarning, makeParseLoader, Replacement} from 'polymer-linter/lib/warning';
import {ProjectConfig} from 'polymer-project-config';

import {CommandResult} from '../commands/command';
import {Options} from '../commands/lint';

const logger = logging.getLogger('cli.lint');

export async function lint(options: Options, config: ProjectConfig) {
  const lintOptions: Partial<typeof config.lint> = (config.lint || {});

  const ruleCodes = options.rules || lintOptions.rules;
  if (ruleCodes === undefined) {
    logger.warn(
        `You must state which lint rules to use. You can use --rules, ` +
        `but for a project it's best to use polymer.json. e.g.

{
  "lint": {
    "rules": ["polymer-2"]
  }
}`);
    return new CommandResult(1);
  }

  const rules = lintLib.registry.getRules(ruleCodes || lintOptions.rules);
  const filter = new WarningFilter({
    warningCodesToIgnore: new Set(lintOptions.ignoreWarnings || []),
    minimumSeverity: Severity.WARNING
  });

  const analyzer = new Analyzer({
    urlLoader: new FSUrlLoader(config.root),
    urlResolver: new PackageUrlResolver(),
  });
  const linter = new lintLib.Linter(rules, analyzer);

  // This is awkward, it would be nice to be able to get access to the analysis
  // of a lint run rather than doing this sort of parallel construction.
  // We want the analysis that the linter sees so that we can apply fixes
  // to the same version of the files that the fixes were constructed for.
  // https://github.com/Polymer/polymer-linter/issues/110
  let warnings;
  let analysis;
  if (options.input) {
    [warnings, analysis] = await Promise.all(
        [linter.lint(options.input), analyzer.analyze(options.input)]);

    const packageRelativeInputFilenames = new Set(options.input.map(
        (i) => path.relative(config.root, path.resolve('.', i))));
    warnings = warnings.filter(
        (w) => packageRelativeInputFilenames.has(w.sourceRange.file));
  } else {
    [warnings, analysis] =
        await Promise.all([linter.lintPackage(), analyzer.analyzePackage()]);
  }


  const filtered = warnings.filter((w) => !filter.shouldIgnore(w));

  if (options.fix) {
    return fix(filtered, config, analyzer, analysis);
  } else {
    return report(filtered);
  }
}

/**
 * Report a friendly description of the given warnings to stdout.
 */
async function report(warnings: Warning[]) {
  const printer =
      new WarningPrinter(process.stdout, {verbosity: 'full', color: true});
  await printer.printWarnings(warnings);

  if (warnings.length > 0) {
    let message = '';
    const errors = warnings.filter((w) => w.severity === Severity.ERROR);
    const warningLevelWarnings =
        warnings.filter((w) => w.severity === Severity.WARNING);
    const infos = warnings.filter((w) => w.severity === Severity.INFO);
    if (errors.length > 0) {
      message += ` ${errors.length} ${chalk.red('errors')}`;
    }
    if (warningLevelWarnings.length > 0) {
      message += ` ${warningLevelWarnings.length} ${chalk.yellow('warnings')}`;
    }
    if (infos.length > 0) {
      message += ` ${infos.length} ${chalk.green('info')} messages`;
    }
    console.log(`\n\nFound ${message}.`);
    return new CommandResult(1);
  }
}

/**
 * Fix all fixable warnings given. Changes files on the filesystem.
 *
 * Reports a summary of the fixes made to stdout.
 */
async function fix(
    warnings: FixableWarning[],
    config: ProjectConfig,
    analyzer: Analyzer,
    analysis: Analysis) {
  const fixes = warnings.map((w) => w.fix).filter((fix) => fix !== undefined) as
      Replacement[][];
  if (fixes.length === 0) {
    console.log('No fixable warnings found.');
    return;
  }

  const {appliedEdits, incompatibleEdits, editedFiles} =
      await applyEdits(fixes, makeParseLoader(analyzer, analysis));

  for (const [newPath, newContents] of editedFiles) {
    await fs.writeFile(
        path.join(config.root, newPath), newContents, {encoding: 'utf8'});
  }

  const appliedChangeCountByFile = countEditsByFile(appliedEdits);
  const incompatibleChangeCountByFile = countEditsByFile(incompatibleEdits);

  for (const [file, count] of appliedChangeCountByFile) {
    console.log(`  Made ${count} change${plural(count)} to ${file}`);
  }

  if (incompatibleEdits.length > 0) {
    console.log('\n');
    for (const [file, count] of incompatibleChangeCountByFile) {
      console.log(`  ${count} incompatible changes in ${file}`);
    }
    console.log(
        `\nFixed ${appliedEdits.length} ` +
        `warning${plural(appliedEdits.length)}, ` +
        `${incompatibleEdits.length} had conflicts with other fixes. ` +
        `Rerunning the command may apply them.`);
  } else {
    console.log(
        `\nFixed ${appliedEdits.length} ` +
        `warning${plural(appliedEdits.length)}.`);
  }
}

/**
 * Computes a map of file path to the count of changes made to that file.
 */
function countEditsByFile(edits: Edit[]): ReadonlyMap<string, number> {
  const changeCountByFile = new Map<string, number>();
  for (const edit of edits) {
    for (const replacement of edit) {
      changeCountByFile.set(
          replacement.range.file,
          (changeCountByFile.get(replacement.range.file) || 0) + 1);
    }
  }
  return changeCountByFile;
}

function plural(n: number): string {
  if (n === 1) {
    return '';
  }
  return 's';
}
