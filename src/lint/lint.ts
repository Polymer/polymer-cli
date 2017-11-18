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
import * as chokidar from 'chokidar';
import * as fs from 'mz/fs';
import * as path from 'path';
import * as logging from 'plylog';
import {Analysis, Analyzer, applyEdits, Edit, EditAction, FSUrlLoader, makeParseLoader, PackageUrlResolver, Severity, Warning} from 'polymer-analyzer';
import {WarningFilter} from 'polymer-analyzer/lib/warning/warning-filter';
import {WarningPrinter} from 'polymer-analyzer/lib/warning/warning-printer';
import * as lintLib from 'polymer-linter';
import {ProjectConfig} from 'polymer-project-config';

import {CommandResult} from '../commands/command';
import {Options} from '../commands/lint';
import {indent, prompt} from '../util';

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

  if (options.watch) {
    return watchLoop(analyzer, linter, options, config, filter);
  } else {
    return run(analyzer, linter, options, config, filter);
  }
}

interface PrivateOptions extends Options {
  /**
   * When running in --watch mode we want to report warnings if we're running
   * with --fix but there weren't any warnings to fix.
   */
  reportIfNoFix?: boolean;
}

/**
 * Run a single pass of the linter, and then report the results or fix warnings
 * as requested by `options`.
 *
 * In a normal run this is called once and then it's done. When running with
 * `--watch` this function is called each time files on disk change.
 */
async function run(
    analyzer: Analyzer,
    linter: lintLib.Linter,
    options: PrivateOptions,
    config: ProjectConfig,
    filter: WarningFilter,
    editActionsToAlwaysApply = new Set(options.edits || []),
    watcher?: FilesystemChangeStream) {
  let warnings;
  if (options.input) {
    warnings = await linter.lint(options.input);
  } else {
    warnings = await linter.lintPackage();
  }
  const analysis = warnings.analysis;

  const filtered = warnings.filter((w) => !filter.shouldIgnore(w));

  if (options.fix) {
    const changedFiles = await fix(
        filtered,
        options,
        config,
        analyzer,
        analysis,
        editActionsToAlwaysApply);
    if (watcher) {
      // Some file watcher interfaces won't notice this change immediately after
      // the one that initiated this lint run. Ensure that we notice these
      // changes.
      for (const changedFile of changedFiles) {
        watcher.ensureChangeIsNoticed(changedFile);
      }
    }
    if (changedFiles.size === 0 && options.reportIfNoFix) {
      await report(filtered);
    }
  } else {
    return report(filtered);
  }
}

async function watchLoop(
    analyzer: Analyzer,
    linter: lintLib.Linter,
    options: Options,
    config: ProjectConfig,
    filter: WarningFilter) {
  let analysis;
  if (options.input) {
    analysis = await analyzer.analyze(options.input);
  } else {
    analysis = await analyzer.analyzePackage();
  }
  /** Remember the user's preferences across runs. */
  const lintActionsToAlwaysApply = new Set(options.edits || []);

  const paths =
      new Set([...analysis.getFeatures({kind: 'document'})].map((d) => d.url));
  const watcher = new FilesystemChangeStream(
      chokidar.watch([...paths], {persistent: true}));
  for await (const changeBatch of watcher) {
    await analyzer.filesChanged([...changeBatch]);

    await run(
        analyzer,
        linter,
        {...options, reportIfNoFix: true},
        config,
        filter,
        lintActionsToAlwaysApply,
        // We pass the watcher to run() so that it can inform the watcher
        // about files that it changes when fixing wanings.
        watcher);

    console.log('\nLint pass complete, waiting for filesystem changes.\n\n');
  }
}

/**
 * Converts the event-based FSWatcher into a batched async iterator.
 */
class FilesystemChangeStream implements AsyncIterable<Set<string>> {
  private nextBatch = new Set<string>();
  private alertWaiter: (() => void)|undefined = undefined;
  private outOfBandNotices: undefined|Set<string> = undefined;

  constructor(watcher: chokidar.FSWatcher) {
    watcher.on('change', (path: string) => {
      this.noticeChange(path);
    });
    watcher.on('unlink', (path: string) => {
      this.noticeChange(path);
    });
  }

  /**
   * Called when we have noticed a change to the file. Ensures that the file
   * will be in the next batch of changes.
   */
  private noticeChange(path: string) {
    this.nextBatch.add(path);
    if (this.alertWaiter) {
      this.alertWaiter();
      this.alertWaiter = undefined;
    }
    if (this.outOfBandNotices) {
      this.outOfBandNotices.delete(path);
    }
  }

  /**
   * Ensures that we will notice a change to the given path, without creating
   * duplicated change notices if the normal filesystem watcher also notices
   * a change to the same path soon.
   *
   * This is a way to notify the watcher when we change a file in response
   * to another change. The FS event watcher used on linux will ignore our
   * change, as it gets grouped in with the change that we were responding to.
   */
  ensureChangeIsNoticed(path: string) {
    if (!this.outOfBandNotices) {
      const notices = new Set();
      this.outOfBandNotices = notices;
      setTimeout(() => {
        for (const path of notices) {
          this.noticeChange(path);
        }
        this.outOfBandNotices = undefined;
      }, 100);
    }
    this.outOfBandNotices.add(path);
  }

  /**
   * Yields batches of filenames.
   *
   * Each batch of files are those changes that have changed since the last
   * batch. Never yields an empty batch, but waits until at least one change is
   * noticed.
   */
  async * [Symbol.asyncIterator](): AsyncIterator<Set<string>> {
    yield new Set();
    while (true) {
      /**
       * If there are changes, yield them. If there are not, wait until
       * there are.
       */
      if (this.nextBatch.size > 0) {
        const batch = this.nextBatch;
        this.nextBatch = new Set();
        yield batch;
      } else {
        const waitingPromise = new Promise((resolve) => {
          this.alertWaiter = resolve;
        });
        await waitingPromise;
      }
    }
  }
}

/**
 * Report a friendly description of the given warnings to stdout.
 */
async function report(warnings: ReadonlyArray<Warning>) {
  const printer =
      new WarningPrinter(process.stdout, {verbosity: 'full', color: true});
  await printer.printWarnings(warnings);

  if (warnings.length > 0) {
    let message = '';
    const errors = warnings.filter((w) => w.severity === Severity.ERROR);
    const warningLevelWarnings =
        warnings.filter((w) => w.severity === Severity.WARNING);
    const infos = warnings.filter((w) => w.severity === Severity.INFO);
    const fixable = warnings.filter((w) => !!w.fix).length;
    const hasEditAction = (w: Warning) =>
        !!(w.actions && w.actions.find((a) => a.kind === 'edit'));
    const editable = warnings.filter(hasEditAction).length;
    if (errors.length > 0) {
      message += ` ${errors.length} ` +
          `${chalk.red('error' + plural(errors.length))}`;
    }
    if (warningLevelWarnings.length > 0) {
      message += ` ${warningLevelWarnings.length} ` +
          `${chalk.yellow('warning' + plural(warnings.length))}`;
    }
    if (infos.length > 0) {
      message += ` ${infos.length} ${chalk.green('info')} message` +
          plural(infos.length);
    }
    if (fixable > 0) {
      message += `. ${fixable} can be automatically fixed with --fix`;
      if (editable > 0) {
        message +=
            ` and ${editable} ${plural(editable, 'have', 'has')} edit actions`;
      }
    } else if (editable > 0) {
      message += `. ${editable} ${plural(editable, 'have', 'has')} ` +
          `edit actions, run with --fix for more info`;
    }
    console.log(`\n\nFound${message}.`);
    return new CommandResult(1);
  }
}

/**
 * Fix all fixable warnings given. Changes files on the filesystem.
 *
 * Reports a summary of the fixes made to stdout.
 */
async function fix(
    warnings: ReadonlyArray<Warning>,
    options: Options,
    config: ProjectConfig,
    analyzer: Analyzer,
    analysis: Analysis,
    editActionsToAlwaysApply: Set<string>): Promise<Set<string>> {
  const edits =
      await getPermittedEdits(warnings, options, editActionsToAlwaysApply);

  if (edits.length === 0) {
    const editCount = warnings.filter((w) => !!w.actions).length;
    if (!options.prompt && editCount) {
      console.log(
          `No fixes to apply. ` +
          `${editCount} action${plural(editCount)} may be applied though. ` +
          `Run in an interactive terminal ` +
          `with --prompt=true for more details.`);
    } else {
      console.log(`No fixes to apply.`);
    }
    return new Set();
  }

  const {appliedEdits, incompatibleEdits, editedFiles} =
      await applyEdits(edits, makeParseLoader(analyzer, analysis));

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
        `warning${plural(appliedEdits.length)}. ` +
        `${incompatibleEdits.length} fixes had conflicts with other fixes. ` +
        `Rerunning the command may apply them.`);
  } else {
    console.log(
        `\nFixed ${appliedEdits.length} ` +
        `warning${plural(appliedEdits.length)}.`);
  }
  const changedFiles = new Set();
  for (const edit of appliedEdits) {
    for (const replacement of edit) {
      changedFiles.add(replacement.range.file);
    }
  }
  return changedFiles;
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

function plural(n: number, pluralVal = 's', singularVal = ''): string {
  if (n === 1) {
    return singularVal;
  }
  return pluralVal;
}

/**
 * Returns edits from fixes and from edit actions with explicit user consent
 * (including prompting the user if we're connected to an interactive
 * terminal).
 */
async function getPermittedEdits(
    warnings: ReadonlyArray<Warning>,
    options: Options,
    editActionsToAlwaysApply: Set<string>): Promise<Edit[]> {
  const edits: Edit[] = [];
  for (const warning of warnings) {
    if (warning.fix) {
      edits.push(warning.fix);
    }
    for (const action of warning.actions || []) {
      if (action.kind === 'edit') {
        if (editActionsToAlwaysApply.has(action.code)) {
          edits.push(action.edit);
          continue;
        }
        if (options.prompt) {
          const answer =
              await askUserForConsentToApplyEditAction(action, warning);
          switch (answer) {
            case 'skip':
              continue;
            case 'apply-all':
              editActionsToAlwaysApply.add(action.code);
            // fall through
            case 'apply':
              edits.push(action.edit);
              break;
            default:
              const never: never = answer;
              throw new Error(`Got unknown user consent result: ${never}`);
          }
        }
      }
    }
  }
  return edits;
}

type Choice = 'skip'|'apply'|'apply-all';
async function askUserForConsentToApplyEditAction(
    action: EditAction, warning: Warning): Promise<Choice> {
  type ChoiceObject = {name: string, value: Choice};
  const choices: ChoiceObject[] = [
    {
      value: 'skip',
      name: 'Do not apply this edit',
    },
    {
      value: 'apply',
      name: 'Apply this edit',
    },
    {
      value: 'apply-all',
      name: `Apply all edits like this [${action.code}]`,
    }
  ];
  const message = `
This warning can be addressed with an edit:
${indent(warning.toString(), '    ')}

The edit is:

${indent(action.description, '    ')}

What should be done?
`.trim();
  return await prompt({message, choices}) as Choice;
}
