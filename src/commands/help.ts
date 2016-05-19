/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import * as chalk from 'chalk';
import {CLI} from 'command-line-commands';
import * as commandLineArgs from 'command-line-args';
import * as logging from 'plylog';

let logger = logging.getLogger('cli.help');


import {globalArguments} from '../args';
import {Command} from './command';

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

  printGeneralUsage() {
    console.log(helpHeader);
    console.log(chalk.bold.underline(`Available Commands\n`));
    for (let command of this.commands.values()) {
      console.log(`  ${chalk.bold(command.name)}\t\t${command.description}`);
    }
    this.printGlobalOptions();
    console.log(`\nRun \`polymer help <command>\` for help with a specific ` +
        `command.\n`);
  }

  printGlobalOptions() {
    let globalCli = commandLineArgs(globalArguments);
    console.log(globalCli.getUsage({
      groups: {
        global: 'Global Options',
      }
    }));
  }

  run(options, config): Promise<any> {
    return new Promise<any>((resolve, _) => {

      if (!options || !options.command) {
        this.printGeneralUsage();
        resolve(null);
        return;
      }

      let command = this.commands.get(options.command);

      if (!command) {
        this.printGeneralUsage();
        resolve(null);
        return;
      }

      logger.debug('logging help for command', command.name);
      let argsCli = commandLineArgs(command.args);
      console.log(argsCli.getUsage({
        title: `polymer ${command.name}`,
        description: command.description,
      }));
      this.printGlobalOptions();
      resolve(null);
    });
  }
}

const h = chalk.bold.underline;
const b = chalk.blue;
const m = chalk.magenta;
const title = h('Polymer-CLI');
const description = 'The multi-tool for Polymer projects';
const usage = 'Usage: \`polymer <command> [options ...]\`';

const helpHeader = '\n' +
    b('   /\\˜˜/   ') + m('/\\˜˜/') + b('\\   ') + '\n' +
    b('  /__\\/   ') + m('/__\\/') + b('__\\  ') + '  ' + title + '\n' +
    b(' /\\  /   ') + m('/\\  /') + b('\\  /\\ ') + '\n' +
    b('/__\\/   ') + m('/__\\/  ') + b('\\/__\\') + '  ' + description + '\n' +
    b('\\  /\\  ') + m('/\\  /   ') + b('/\\  /') + '\n' +
    b(' \\/__\\') + m('/__\\/   ') + b('/__\\/ ') + '  ' + usage + '\n' +
    b('  \\  ') + m('/\\  /   ') + b('/\\  /  ') + '\n' +
    b('   \\') + m('/__\\/   ') + b('/__\\/   ') + '\n';
