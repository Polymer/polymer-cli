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

import * as logging from 'plylog';
import {Analyzer} from 'polymer-analyzer';
import {FSUrlLoader} from 'polymer-analyzer/lib/url-loader/fs-url-loader';
import {PackageUrlResolver} from 'polymer-analyzer/lib/url-loader/package-url-resolver';
import {Severity, Warning} from 'polymer-analyzer/lib/warning/warning';
import {WarningFilter} from 'polymer-analyzer/lib/warning/warning-filter';
import {WarningPrinter} from 'polymer-analyzer/lib/warning/warning-printer';
import * as lintLib from 'polymer-linter';
import {ProjectConfig} from 'polymer-project-config';

import {Command, CommandOptions} from './command';

const logger = logging.getLogger('cli.lint');

export class LintCommand implements Command {
  name = 'lint';

  description = 'Lints the project';

  args = [];

  async run(_options: CommandOptions, config: ProjectConfig): Promise<any> {
    // Defer dependency loading until this specific command is run
    // const polylint = require('polymer-lint');

    const lintOptions = config.lint;
    if (!lintOptions) {
      logger.warn(`Linter is configured through polymer.json. e.g.:

{
  "lint": {
    "rules": ["polymer-2"]
  }
}`);
      return;
    }

    const rules = lintLib.registry.getRules(lintOptions.rules);
    const filter = new WarningFilter({
      warningCodesToIgnore: new Set(lintOptions.ignoreWarnings || []),
      minimumSeverity: Severity.WARNING
    });


    const analyzer = new Analyzer({
      urlLoader: new FSUrlLoader(config.root),
      urlResolver: new PackageUrlResolver(),
    });

    const linter = new lintLib.Linter(rules, analyzer);

    const warnings = await linter.lintPackage();

    const filtered = warnings.filter((w) => !filter.shouldIgnore(w));

    // TODO: Make verbosity and color configurable.
    const printer = new WarningPrinter(
        process.stdout, {analyzer: analyzer, verbosity: 'full', color: true});
    await printer.printWarnings(filtered);

    process.exitCode = this._getExitCode(filtered);
  }

  private _getExitCode(filteredWarnings: Warning[]) {
    if (filteredWarnings.length === 0) {
      return 0;
    }
    return 1;
  }
}
