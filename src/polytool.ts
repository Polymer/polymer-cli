/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import * as commandLineCommands from 'command-line-commands';
import {BuildCommand} from './commands/build';
import {HelpCommand} from './commands/help';
import {InitCommand} from './commands/init';
import {LintCommand} from './commands/lint';
import {ServeCommand} from './commands/serve';
import {TestCommand} from './commands/test';
import {Command} from './commands/command';

export class Polytool {

  commandDescriptors = [];
  commands : Map<String, Command> = new Map();
  cli : commandLineCommands.CLI;

  constructor() {
    this.addCommand(new BuildCommand());
    this.addCommand(new HelpCommand(this.commands));
    this.addCommand(new InitCommand());
    this.addCommand(new LintCommand());
    this.addCommand(new ServeCommand());
    this.addCommand(new TestCommand());
  }

  addCommand(command) {
    this.commands.set(command.name, command);
    this.commandDescriptors.push({
      name: command.name,
      definitions: command.args,
      description: command.description,
    });
  }

  run(args) {
    this.cli = commandLineCommands(this.commandDescriptors);
    let cliCommand = this.cli.parse(args);
    let polytoolCommand = this.commands.get(cliCommand.name || 'help');

    polytoolCommand.run(cliCommand.options).then((result) => {
      // success
    }, (err) => {
      console.error('error', err);
    });
  }
}
