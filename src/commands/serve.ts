/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {Command} from './command';
import * as logging from 'plylog';

let logger = logging.getLogger('cli.command.serve');


export class ServeCommand implements Command {
  name = 'serve';

  description = 'Runs the polyserve development server';

  args = [
    {
      name: 'port',
      alias: 'p',
      description: 'The port to serve from. Defaults to 8080',
      type: Number,
    },
    {
      name: 'hostname',
      alias: 'H',
      description: 'The hostname to serve from. Defaults to localhost',
      type: String,
    },
    {
      name: 'package-name',
      alias: 'n',
      description: 'The package name to use for the root directory. Defaults ' +
          'to reading from bower.json',
      type: String,
    },
    {
      name: 'open',
      alias: 'o',
      description: 'The page to open in the default browser on startup.',
      type: Boolean,
    },
    {
      name: 'browser',
      alias: 'b',
      description: 'The browser(s) to open with when using the --open option.' +
          ' Defaults to your default web browser.',
      type: String,
      multiple: true,
    },
    {
      name: 'open-path',
      description: 'The URL path to open when using the --open option.' +
          ' Defaults to "index.html".',
      type: String,
    },
    {
      name: 'root',
      defaultOption: true,
    },
  ];

  run(options, config): Promise<any> {
    // Defer dependency loading until this specific command is run
    const polyserve = require('polyserve');
    const ServerOptions = require('polyserve/lib/start_server').ServerOptions;
    const Environment = require('../environment/environment').Environment;

    let openPath;
    if (config.entrypoint && config.shell) {
      let rootLength = (config.root && config.root.length) || 0;
      openPath = config.entrypoint.substring(config.root.length);
      if (openPath === 'index.html' || openPath === '/index.html') {
        openPath = '/';
      }
    }
    let serverOptions: ServerOptions = {
      root: config.root,
      port: options.port,
      hostname: options.hostname,
      open: options.open,
      openPath: openPath,
      browser: options.browser,
      componentDir: options['component-dir'],
      packageName: options['package-name'],
    };

    logger.debug('serving with options', serverOptions);
    const env: Environment = options.env;

    if (env && env.serve) {
      logger.debug('env.serve() found in options');
      logger.debug('serving via env.serve()...');
      return env.serve(serverOptions);
    }

    logger.debug('serving via polyserve.startServer()...');
    return polyserve.startServer(serverOptions);
  }
}
