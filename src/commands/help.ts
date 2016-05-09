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

  printGeneralUsage() {
    console.log(`\nUsage: polymer <command>\n`);
    console.log(`polymer supports the following commands:`);
    for (let command of this.commands.values()) {
      console.log(`  ${command.name}\t\t${command.description}`);
    }
    console.log(`\nRun \`polymer help <command>\` for help with a specific command.\n`);
  }

  run(options): Promise<any> {
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

      let argsCli = commandLineArgs(command.args);
      console.log(argsCli.getUsage({
        title: `polymer ${command.name}`,
        description: command.description,
      }));
      resolve(null);
    });
  }
}
