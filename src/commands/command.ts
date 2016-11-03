import {ArgDescriptor} from 'command-line-args';

import {ProjectConfig} from 'polymer-project-config';
export {ProjectConfig} from 'polymer-project-config';

export type CommandOptions = { [name: string]: any };

export interface Command {
  name: string;
  description: string;
  args: ArgDescriptor[];
  run(options: CommandOptions, config: ProjectConfig): Promise<any>;
}

export {ArgDescriptor} from 'command-line-args';
