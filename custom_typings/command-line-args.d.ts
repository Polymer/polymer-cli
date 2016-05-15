declare module 'command-line-args' {
  function commandLineArgs(args: commandLineArgs.ArgDescriptor[])
      : commandLineArgs.CLI;

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
    interface UsageOpts {
      title?: string;
      header?: string;
      description?: string;
      groups?: any;
    }
    interface CLI {
      parse(): any;
      getUsage(opts: UsageOpts): string;
    }
  }

  export = commandLineArgs;
}
