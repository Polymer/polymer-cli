import {Command} from './command';
import {CLI} from 'command-line-commands';
import * as commandLineArgs from 'command-line-args';

export class HelpCommand implements Command {
  name = 'help';

  description = 'Shows this help message, or help for a specific command';

  args = [{
    name: 'command',
    description: 'The command to display help for',
    defaultOption: true,
  }];

  commands : Map<String, Command> = new Map();

  constructor(commands : Map<String, Command>) {
    this.commands = commands;
  }

  run(options): Promise<any> {
    return new Promise<any>((resolve, _) => {
      if (options.command) {
        let command = this.commands.get(options.command);
        if (!command) {
          console.log(`unknown command ${command}`);
        } else {
          let argsCli = commandLineArgs(command.args);
          console.log(argsCli.getUsage({
            title: `polytool ${command.name}`,
            description: command.description,
          }));
        }
      } else {
        console.log(`polytool - The Polymer command-line tool\n`);
        console.log(`usage: polytool <command> [<args>]\n`);
        console.log(`polytool supports the following commands:`);
        for (let command of this.commands.values()) {
          console.log(`  ${command.name}\t\t${command.description}`);
        }
        console.log(`\nRun \`polytool help <command>\` for help on a specific command.\n`);
      }
      resolve(null);
    });
  }
}
