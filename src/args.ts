/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {ArgDescriptor} from './commands/command';
import {Environment} from './environment/environment';
import {buildEnvironment} from './environments/environments';

export const globalArguments: ArgDescriptor[] = [
  {
    name: 'env',
    description: 'The environment to use to specialize certain commands, '
        + 'like build',
    type: function(value): Environment {
      return buildEnvironment(value);
    },
    group: 'global',
  },
  {
    name: 'entrypoint',
    description: 'The main HTML file that will requested for all routes.',
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
    description: 'The directory where your project exists. ' +
        'Defaults to the current working directory',
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
    name: 'include-dependencies',
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
