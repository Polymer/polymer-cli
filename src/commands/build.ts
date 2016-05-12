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

export class BuildCommand implements Command {
  name = 'build';

  description = 'Builds an application-style project';

  args = [
    {
      name: 'main',
      description: 'The main HTML file',
      defaultValue: 'index.html',
      defaultOption: true
    },
    {
      name: 'sources',
      multiple: true,
      description: 'The sources file to build',
    },
    {
      name: 'sw-precache-config',
      defaultValue: 'sw-precache-config.js',
      description: 'Path to an sw-precache configuration to be ' +
        'used for service worker generation.'
    }
  ];

  run(options, config): Promise<any> {
    // Defer dependency loading until this specific command is run
    const build = require('../build/build').build;

    let buildOptions = {
      sources: options.sources,
      swPrecacheConfig: options['sw-precache-config']
    };
    if (options.env && options.env.build) {
      return options.env.build(buildOptions, config);
    }
    return build(buildOptions, config);
  }
}
