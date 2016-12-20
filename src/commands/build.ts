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

import * as logging from 'plylog';

// Only import type definitions here, otherwise this line will be included in
// the JS output, triggering  the entire build library & its dependencies to
// be loaded and parsed.
import {BuildOptions} from '../build/build';

import {ProjectConfig} from 'polymer-project-config';
import {Command, CommandOptions} from './command';

let logger = logging.getLogger('cli.command.build');


export class BuildCommand implements Command {
  name = 'build';

  description = 'Builds an application-style project';

  args = [
    {
      name: 'js-minify',
      type: Boolean,
      description: 'minify inlined and external JavaScript.'
    },
    {
      name: 'css-minify',
      type: Boolean,
      description: 'minify inlined and external CSS.'
    },
    {
      name: 'html-minify',
      type: Boolean,
      description: 'minify HTML by removing comments and whitespace.'
    },
    {
      name: 'js-compile',
      type: Boolean,
      description: 'Combine build source and dependency files together into ' +
          'a minimum set of bundles. Useful for reducing the number of ' +
          'requests needed to serve your application.'
    },
    {
      name: 'sw-precache-config',
      defaultValue: 'sw-precache-config.js',
      description: 'Path to an sw-precache configuration to be ' +
          'used for service worker generation.'
    },
    {
      name: 'insert-dependency-links',
      type: Boolean,
      description: 'Flatten dependency tree downloads by inserting ' +
          'additional `<link rel="prefetch">` tags into ' +
          'entrypoint and `<link rel="import">` tags into fragments and shell.'
    },
  ];

  run(options: CommandOptions, config: ProjectConfig): Promise<any> {
    // Defer dependency loading until this specific command is run
    const build = require('../build/build').build;

    let buildOptions: BuildOptions = {
      swPrecacheConfig: options['sw-precache-config'],
      insertDependencyLinks: options['insert-dependency-links'],
      html: {
        minify: !!options['html-minify'],
      },
      css: {
        minify: !!options['css-minify'],
      },
      js: {
        minify: !!options['js-minify'],
        compile: !!options['js-compile'],
      },
    };

    logger.debug('building with options', buildOptions);

    if (options['env'] && options['env'].build) {
      logger.debug('env.build() found in options');
      logger.debug('building via env.build()...');
      return options['env'].build(buildOptions, config);
    }

    logger.debug('building via standard build()...');
    return build(buildOptions, config);
  }
}
