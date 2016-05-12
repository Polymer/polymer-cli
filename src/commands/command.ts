import {ArgDescriptor} from 'command-line-args';

import {Config} from '../config';

export interface Command {
  name: string;
  description: string;
  args: ArgDescriptor[];
  run(options: {[name: string]: string}, config: Config): Promise<any>;
}

export {ArgDescriptor} from 'command-line-args';
