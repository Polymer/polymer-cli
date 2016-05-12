import {ArgDescriptor} from 'command-line-args';

import {ProjectConfig} from '../project-config';

export interface Command {
  name: string;
  description: string;
  args: ArgDescriptor[];
  run(options: {[name: string]: string}, config: ProjectConfig): Promise<any>;
}

export {ArgDescriptor} from 'command-line-args';
