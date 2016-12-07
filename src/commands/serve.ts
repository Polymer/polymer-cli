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
import {args as polyserveArgs} from 'polyserve/lib/args';
// Only import type definitions here, otherwise this line will be included in
// the JS output, triggering  the entire build library & its dependencies to
// be loaded and parsed.
import {ServerOptions} from 'polyserve/lib/start_server';

import {Environment} from '../environment/environment';

import {Command, CommandOptions, ProjectConfig} from './command';

let logger = logging.getLogger('cli.command.serve');


export class ServeCommand implements Command {
  name = 'serve';

  description = 'Runs the polyserve development server';

  args = polyserveArgs;

  run(options: CommandOptions, config: ProjectConfig): Promise<any> {
    // Defer dependency loading until this specific command is run
    const polyserve = require('polyserve');

    let openPath: string|undefined;
    if (config.entrypoint && config.shell) {
      openPath = config.entrypoint.substring(config.root.length);
      if (openPath === 'index.html' || openPath === '/index.html') {
        openPath = '/';
      }
    }
    let serverOptions: ServerOptions = {
      root: config.root,
      port: options['port'],
      hostname: options['hostname'],
      open: options['open'],
      openPath: openPath,
      browser: options['browser'],
      componentDir: options['component-dir'],
      packageName: options['package-name'],
    };

    logger.debug('serving with options', serverOptions);
    const env: Environment = options['env'];

    if (env && env.serve) {
      logger.debug('env.serve() found in options');
      logger.debug('serving via env.serve()...');
      return env.serve(serverOptions);
    }

    logger.debug('serving via polyserve.startServer()...');
    return polyserve.startServer(serverOptions);
  }
}
