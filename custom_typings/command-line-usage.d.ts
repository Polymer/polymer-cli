declare module 'command-line-usage' {
  module commandLineUsage {
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
    interface UsageGroup {
      header?: string;
      content?: any;
      optionList?: ArgDescriptor[];
      raw?: boolean;
    }
  }

  function commandLineUsage(groups: commandLineUsage.UsageGroup[]): string;

  export = commandLineUsage;
}
