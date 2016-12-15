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
import {ProjectConfig} from 'polymer-project-config';

// Only import type definitions here, otherwise this line will be included in
// the JS output, triggering  the entire build library & its dependencies to
// be loaded and parsed.
import {BuildOptions} from '../build/build';

import {Command, CommandOptions} from './command';

let logger = logging.getLogger('cli.command.build');


export class BuildCommand implements Command {
  name = 'build';

  description = 'Builds an application-style project';

  args = [
    {
      name: 'bundle',
      defaultValue: false,
      description: 'Combine build source and dependency files together into ' +
          'a minimum set of bundles. Useful for reducing the number of ' +
          'requests needed to serve your application.'
    },
    {
      name: 'compile',
      type: Boolean,
      description: 'Path to an sw-precache configuration to be ' +
          'used for service worker generation.'
    },
    {
      name: 'sw-precache-config',
      defaultValue: 'sw-precache-config.js',
      description: 'Path to an sw-precache configuration to be ' +
          'used for service worker generation.'
    },
    {
      name: 'insert-prefetch-links',
      type: Boolean,
      description: 'Add dependency prefetching by inserting ' +
          '`<link rel="prefetch">` tags into entrypoint and ' +
          '`<link rel="import">` tags into fragments and shell for all ' +
          'dependencies.'
    },
    {
      name: 'html.collapseWhitespace',
      type: Boolean,
      description: 'Collapse whitespace in HTML files'
    }
  ];

  run(options: CommandOptions, config: ProjectConfig): Promise<any> {
    // Defer dependency loading until this specific command is run
    const build = require('../build/build').build;

    let buildOptions: BuildOptions = {
      compile: options['compile'],
      swPrecacheConfig: options['sw-precache-config'],
      insertPrefetchLinks: options['insert-prefetch-links'],
      bundle: options['bundle'],
      html: {},
      css: {},
      js: {},
    };
    if (options['html.collapseWhitespace']) {
      buildOptions.html!.collapseWhitespace = true;
    }
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
