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

// Be careful with these imports. As much as possible should be deferred until
// the command is actually run, in order to minimize startup time from loading
// unused code. Any imports that are only used as types will be removed from the
// output JS and so not result in a require() statement.

import * as chalk from 'chalk';
import {ArgDescriptor} from 'command-line-args';
import * as commandLineUsage from 'command-line-usage';
import * as logging from 'plylog';
import {Analyzer} from 'polymer-analyzer';
import {FSUrlLoader} from 'polymer-analyzer/lib/url-loader/fs-url-loader';
import {PackageUrlResolver} from 'polymer-analyzer/lib/url-loader/package-url-resolver';
import {Severity, Warning} from 'polymer-analyzer/lib/warning/warning';
import {WarningFilter} from 'polymer-analyzer/lib/warning/warning-filter';
import {WarningPrinter} from 'polymer-analyzer/lib/warning/warning-printer';
import * as lintLibTypeOnly from 'polymer-linter';
import {ProjectConfig} from 'polymer-project-config';

import {Command} from './command';

const logger = logging.getLogger('cli.lint');

export interface Options {
  rules?: string[];
  input?: string[];
}

export class LintCommand implements Command {
  // TODO(rictic): rename to 'lint' here and elsewhere, delete
  // legacy-lint.ts. Also update the README.
  name = 'experimental-lint';

  description = 'Identifies potential errors in your code.';

  args: ArgDescriptor[] = [
    {
      name: 'input',
      type: String,
      alias: 'i',
      defaultOption: true,
      multiple: true,
      description: 'Files to lint. If given, these files will be the only ' +
          'ones linted, otherwise all files in the project will be linted.'
    },
    {
      name: 'rules',
      type: String,
      alias: 'r',
      multiple: true,
      description: 'The lint rules/rule collections to apply. ' +
          'See `polymer help lint` for a list of rules.',
    }
  ];

  /**
   * TODO(rictic): things to make configurable:
   *   - lint warning verbosity
   *   - whether to use color (also: can we autodetect if color is supported?)
   *   - add option for input files to polymer.json
   *   - modules to load that can register new rules
   *   - --watch
   *   - --fix
   */

  async run(options: Options, config: ProjectConfig): Promise<any> {
    // Defer dependency loading until this specific command is run.
    const lintLib: typeof lintLibTypeOnly = require('polymer-linter');
    this._loadPlugins(config);

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
      process.exitCode = 1;
      return;
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

    const warnings = await this._lint(linter, options.input);

    const filtered = warnings.filter((w) => !filter.shouldIgnore(w));

    const printer = new WarningPrinter(
        process.stdout, {analyzer: analyzer, verbosity: 'full', color: true});
    await printer.printWarnings(filtered);

    process.exitCode = this._getExitCode(filtered);
  }

  extraUsageGroups(config: ProjectConfig): commandLineUsage.UsageGroup[] {
    const lintLib: typeof lintLibTypeOnly = require('polymer-linter');
    this._loadPlugins(config);
    let collectionsDocs = [];
    for (const collection of lintLib.registry.allRuleCollections) {
      collectionsDocs.push(`  ${chalk.bold(collection.code)}: ${this._indent(
          collection.description)}`);
    }
    let rulesDocs = [];
    for (const rule of lintLib.registry.allRules) {
      rulesDocs.push(
          `  ${chalk.bold(rule.code)}: ${this._indent(rule.description)}`);
    }
    return [
      {
        header: 'Lint Rule Collections',
        content: collectionsDocs.join('\n\n'),
        raw: true
      },
      {header: 'Lint Rules', content: rulesDocs.join('\n\n'), raw: true}
    ];
  }

  private _indent(description: string) {
    return description.split('\n')
        .map((line, idx) => {
          if (idx === 0) {
            return line;
          }
          if (line.length === 0) {
            return line;
          }
          return '      ' + line;
        })
        .join('\n');
  }

  private _loadPlugins(_config: ProjectConfig) {
    // TODO(rictic): implement.
  }

  private async _lint(
      linter: lintLibTypeOnly.Linter,
      input: string[]|undefined): Promise<Warning[]> {
    if (input) {
      return linter.lint(input);
    } else {
      return linter.lintPackage();
    }
  }

  private _getExitCode(filteredWarnings: Warning[]) {
    if (filteredWarnings.length === 0) {
      return 0;
    }
    return 1;
  }
}
