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

import {ArgDescriptor} from 'command-line-args';
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
  name = 'lint';

  description = 'Scans';

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

  /**
   * TODO(rictic): expose rules and rulecollections off the lint registry so
   *   that we can print their descriptions in the help menu.
   */

  async run(options: Options, config: ProjectConfig): Promise<any> {
    // Defer dependency loading until this specific command is run.
    const lintLib: typeof lintLibTypeOnly = require('polymer-linter');

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
