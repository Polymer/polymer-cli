/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {ArgDescriptor} from 'command-line-args';
import {UsageGroup} from 'command-line-usage';
import {ProjectConfig} from 'polymer-project-config';

export type CommandOptions = {
  [name: string]: any
};

export interface Command {
  name: string;
  description: string;
  args: ArgDescriptor[];
  run(options: CommandOptions,
      config: ProjectConfig): Promise<CommandResult|void>;

  /**
   * Documentation to append onto the output of `polymer help commandName`.
   */
  extraUsageGroups?(config: ProjectConfig): UsageGroup[];
}

/**
 * A command may return a CommandResult to indicate an exit code.
 */
export class CommandResult {
  constructor(public exitCode: number) {
  }
}
