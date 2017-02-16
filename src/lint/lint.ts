import * as chalk from 'chalk';
import * as logging from 'plylog';
import {Analyzer} from 'polymer-analyzer';
import {FSUrlLoader} from 'polymer-analyzer/lib/url-loader/fs-url-loader';
import {PackageUrlResolver} from 'polymer-analyzer/lib/url-loader/package-url-resolver';
import {Severity} from 'polymer-analyzer/lib/warning/warning';
import {WarningFilter} from 'polymer-analyzer/lib/warning/warning-filter';
import {WarningPrinter} from 'polymer-analyzer/lib/warning/warning-printer';
import * as lintLib from 'polymer-linter';
import {ProjectConfig} from 'polymer-project-config';
import {CommandFailure} from '../commands/command';

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
    throw new CommandFailure(1);
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

  let warnings;
  if (options.input) {
    warnings = await linter.lint(options.input);
  } else {
    warnings = await linter.lintPackage();
  }

  const filtered = warnings.filter((w) => !filter.shouldIgnore(w));

  const printer = new WarningPrinter(
      process.stdout, {analyzer: analyzer, verbosity: 'full', color: true});
  await printer.printWarnings(filtered);

  if (filtered.length > 0) {
    let message = '';
    const errors = filtered.filter((w) => w.severity === Severity.ERROR);
    const warnings = filtered.filter((w) => w.severity === Severity.WARNING);
    const infos = filtered.filter((w) => w.severity === Severity.INFO);
    if (errors.length > 0) {
      message += ` ${errors.length} ${chalk.red('errors')}`;
    }
    if (warnings.length > 0) {
      message += ` ${warnings.length} ${chalk.yellow('warnings')}`;
    }
    if (infos.length > 0) {
      message += ` ${infos.length} ${chalk.green('info')} messages`;
    }
    console.log(`\n\nFound ${message}.`);
    throw new CommandFailure(1);
  }
}
