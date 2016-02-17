'use strict';

import * as commandLineCommands from 'command-line-commands';
import {HelpCommand} from './commands/help';
import {ServeCommand} from './commands/serve';
import {Command} from './commands/command';

export class Polytool {

  commandDescriptors = [];
  commands : Map<String, Command> = new Map();
  cli : commandLineCommands.CLI;

  constructor() {
    this.addCommand(new HelpCommand(this.commands));
    this.addCommand(new ServeCommand());
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

    if (!cliCommand.name) {
      if (args[2]) {
        console.error('unknown command', args[2]);
      } else {
        console.error('must specify a command');
      }
      process.exit(1);
    }

    const command = this.commands.get(cliCommand.name);
    command.run(cliCommand.options).then((result) => {
      // success
    }, (err) => {
      console.error('error', err);
    });
  }
}
