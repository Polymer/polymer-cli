declare module 'command-line-commands' {
  module commandLineCommands {
    interface ParsedCommand {
      command: string;
      argv: string[];
    }
  }

  function commandLineCommands(commands: string[], argv?: string[])
      : commandLineCommands.ParsedCommand;

  export = commandLineCommands;
}
