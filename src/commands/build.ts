/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {ArgDescriptor} from 'command-line-args';
import {CLI} from 'command-line-commands';

import {Command} from './command';
import {build} from '../build/build';

export class BuildCommand implements Command {
  name = 'build';

  description = 'Builds an application-style project';

  args = [
    {
      name: 'main',
      description: 'The main HTML file',
      defaultOption: true,
    },
    {
      name: 'shell',
      description: 'The app shell',
    },
    {
      name: 'entrypoint',
      multiple: true,
    },
    {
      name: 'sources',
      description: 'The sources file to build',
    }
  ];

  run(options): Promise<any> {
    return build({
      main: options.main,
      shell: options.shell,
      entrypoints: options.entrypoint,
      sources: options.sources,
    });
  }
}
