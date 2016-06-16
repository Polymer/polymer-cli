declare module 'command-line-args' {
  module commandLineArgs {
    interface ArgDescriptor {
      name: string;
      alias?: string;
      description?: string;
      defaultValue?: any;
      type?: Object;
      multiple?: boolean;
      defaultOption?: boolean;
      group?: string;
    }
  }

  function commandLineArgs(groups: commandLineArgs.ArgDescriptor[], args?: string[]): any;

  export = commandLineArgs;
}
