import {ArgDescriptor} from 'command-line-args';

export interface Command {
  name: string;
  description: string;
  args: ArgDescriptor[];
  run(options: {[name: string]: string}): Promise<any>;
}

// TODO(justinfagnani): how do I re-export an interface?
export interface ArgDescriptor extends ArgDescriptor {
//   // name: string;
//   // alias?: string;
//   // description: string;
//   // defaultValue?: any;
//   // type?: Object;
//   // multiple?: boolean;
//   // defaultOption?: boolean;
}
