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
import * as commandLineUsage from 'command-line-usage';
import * as logging from 'plylog';
import {ProjectConfig} from 'polymer-project-config';

import {globalArguments} from '../args';

import {Command, CommandOptions} from './command';

let logger = logging.getLogger('cli.command.help');

const b = chalk.blue;
const m = chalk.magenta;
const CLI_TITLE = chalk.bold.underline('Polymer-CLI');
const CLI_DESCRIPTION = 'The multi-tool for Polymer projects';
const CLI_USAGE = 'Usage: \`polymer <command> [options ...]\`';

const HELP_HEADER = `
   ${b('/\\˜˜/')}   ${m('/\\˜˜/')}${b('\\')}
  ${b('/__\\/')}   ${m('/__\\/')}${b('_\_\\')}    ${CLI_TITLE}
 ${b('/\\  /')}   ${m('/\\  /')}${b('\\  /\\')}
${b('/__\\/')}   ${m('/__\\/')}  ${b('\\/__\\')}  ${CLI_DESCRIPTION}
${b('\\  /\\')}  ${m('/\\  /')}   ${b('/\\  /')}
 ${b('\\/__\\')}${m('/__\\/')}   ${b('/__\\/')}   ${CLI_USAGE}
  ${b('\\')}  ${m('/\\  /')}   ${b('/\\  /')}
   ${b('\\')}${m('/__\\/')}   ${b('/__\\/')}
`;

export class HelpCommand implements Command {
  name = 'help';

  description = 'Shows this help message, or help for a specific command';

  args = [{
    name: 'command',
    description: 'The command to display help for',
    defaultOption: true,
  }];

  commands: Map<String, Command> = new Map();

  constructor(commands: Map<String, Command>) {
    this.commands = commands;
  }

  generateGeneralUsage() {
    return commandLineUsage([
      {
        content: HELP_HEADER,
        raw: true,
      },
      {
        header: 'Available Commands',
        content: Array.from(this.commands.values()).map((command) => {
          return {name: command.name, summary: command.description};
        }),
      },
      {header: 'Global Options', optionList: globalArguments},
      {
        content:
            'Run `polymer help <command>` for help with a specific command.',
        raw: true,
      }
    ]);
  }

  generateCommandUsage(command: Command, config: ProjectConfig) {
    const extraUsageGroups =
        command.extraUsageGroups ? command.extraUsageGroups(config) : [];
    const usageGroups: commandLineUsage.UsageGroup[] = [
      {
        header: `polymer ${command.name}`,
        content: command.description,
      },
      {header: 'Command Options', optionList: command.args},
      {header: 'Global Options', optionList: globalArguments},
    ];
    return commandLineUsage(usageGroups.concat(extraUsageGroups));
  }

  async run(options: CommandOptions, config: ProjectConfig) {
    const commandName: string = options['command'];
    if (!commandName) {
      logger.debug(
          'no command given, printing general help...', {options: options});
      console.log(this.generateGeneralUsage());
      return;
    }

    let command = this.commands.get(commandName);
    if (!command) {
      logger.error(`'${commandName}' is not an available command.`);
      console.log(this.generateGeneralUsage());
      return;
    }

    logger.debug(`printing help for command '${commandName}'...`);
    console.log(this.generateCommandUsage(command, config));
  }
}
