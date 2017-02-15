import * as logging from 'plylog';
import {Analyzer} from 'polymer-analyzer';
import {FSUrlLoader} from 'polymer-analyzer/lib/url-loader/fs-url-loader';
import {PackageUrlResolver} from 'polymer-analyzer/lib/url-loader/package-url-resolver';
import {Severity, Warning} from 'polymer-analyzer/lib/warning/warning';
import {WarningFilter} from 'polymer-analyzer/lib/warning/warning-filter';
import {WarningPrinter} from 'polymer-analyzer/lib/warning/warning-printer';
import * as lintLib from 'polymer-linter';
import {ProjectConfig} from 'polymer-project-config';
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

  const warnings = await _lint(linter, options.input);

  const filtered = warnings.filter((w) => !filter.shouldIgnore(w));

  const printer = new WarningPrinter(
      process.stdout, {analyzer: analyzer, verbosity: 'full', color: true});
  await printer.printWarnings(filtered);

  process.exitCode = _getExitCode(filtered);
}

async function _lint(linter: lintLib.Linter, input: string[]|undefined):
    Promise<Warning[]> {
      if (input) {
        return linter.lint(input);
      } else {
        return linter.lintPackage();
      }
    }

function _getExitCode(filteredWarnings: Warning[]) {
  if (filteredWarnings.length === 0) {
    return 0;
  }
  return 1;
}
