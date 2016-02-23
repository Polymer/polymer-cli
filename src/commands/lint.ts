import {Command} from './command';
import * as polylint from 'polylint/lib/cli';

export class LintCommand implements Command {
  name = 'lint';

  description = 'Lints the project';

  args = polylint.argumentDefinitions;

  run(options): Promise<any> {
    return polylint.runWithOptions(options)
        .then(() => null);
  }
}
