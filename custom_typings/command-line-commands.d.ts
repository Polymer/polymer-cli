declare module 'command-line-commands' {
  module commandLineCommands {
    interface CommandDescriptor {
      name: string;
      definitions?: any[];
      description?: string;
      defaultOption?: boolean;
    }

    interface Command {
      name: string;
      options: {[name: string]: string};
    }

    interface CLI {
      commands: CommandDescriptor[];
      parse(args?: string[]): Command;
      getUsage(): string;
    }
  }

  function commandLineCommands(args: commandLineCommands.CommandDescriptor[])
      : commandLineCommands.CLI;

  export = commandLineCommands;
}
