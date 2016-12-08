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
import {Environment} from './environment/environment';
import {buildEnvironment} from './environments/environments';

export const globalArguments: ArgDescriptor[] = [
  {
    name: 'env',
    description: 'The environment to use to specialize certain commands, ' +
        'like build',
    type: (value: string): Environment | undefined => {
      return buildEnvironment(value);
    },
    group: 'global',
  },
  {
    name: 'entrypoint',
    description: 'The main HTML file that will be requested for all routes.',
    group: 'global',
  },
  {
    name: 'shell',
    type: String,
    description: 'The app shell HTML import',
    group: 'global',
  },
  {
    name: 'fragment',
    type: String,
    multiple: true,
    description: 'HTML imports that are loaded on-demand.',
    group: 'global',
  },
  {
    name: 'root',
    type: String,
    description: 'The root directory of your project. Defaults to the current' +
        ' working directory',
    group: 'global',
  },
  {
    name: 'sources',
    type: String,
    multiple: true,
    description: 'Glob(s) that match your project source files. ' +
        'Defaults to `src/**/*`.',
    group: 'global',
  },
  {
    name: 'extra-dependencies',
    type: String,
    multiple: true,
    description: 'Glob(s) that match any additional dependencies not caught ' +
        'by the analyzer to include with your build.',
    group: 'global',
  },
  {
    name: 'verbose',
    description: 'turn on debugging output',
    type: Boolean,
    alias: 'v',
    group: 'global',
  },
  {
    name: 'help',
    description: 'print out helpful usage information',
    type: Boolean,
    alias: 'h',
    group: 'global',
  },
  {
    name: 'quiet',
    description: 'silence output',
    type: Boolean,
    alias: 'q',
    group: 'global',
  },
];

/**
 * Performs a simple merge of multiple arguments lists. Does not mutate given
 * arguments lists or arguments.
 *
 * This doesn't perform any validation of duplicate arguments, mutiple defaults,
 * etc., because by the time this function is run, the user can't do anything
 * about it. Validation of command and global arguments should be done in tests,
 * not on users machines.
 */
export function mergeArguments(argumentLists: ArgDescriptor[][]):
    ArgDescriptor[] {
  const argsByName = new Map<string, ArgDescriptor>();
  for (const args of argumentLists) {
    for (const arg of args) {
      argsByName.set(
          arg.name, Object.assign({}, argsByName.get(arg.name), arg));
    }
  }
  return Array.from(argsByName.values());
}
