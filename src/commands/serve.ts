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

const startServer = require('polyserve').startServer;

export class ServeCommand implements Command {
  name = 'serve';

  description = 'Runs the polyserve development server';

  args = [
    {
      name: 'port',
      alias: 'p',
      description: 'The port to serve files from. Defaults to 8080',
      type: Number,
    },
    {
      name: 'hostname',
      alias: 'h',
      description: 'The hostname to serve. Defaults to localhost',
      type: String,
    },
    {
      name: 'component-dir',
      alias: 'c',
      description: 'The component directory to use. Defaults to reading from' +
          ' the Bower config (usually bower_components/)',
      type: String,
    },
    {
      name: 'package-name',
      alias: 'n',
      description: 'Package name. Defaults to reading from bower.json',
      type: String,
    },
    {
      name: 'open',
      alias: 'o',
      description: 'Open page in default browser on startup.' +
          ' Defaults to index.html',
      type: String,
    },
    {
      name: 'browser',
      alias: 'b',
      description: 'The browser to open when using the --open option.' +
          ' Defaults to chrome',
      type: String,
    },
  ];

  run(options): Promise<any> {
    return startServer({
      port: options['port'],
      componentDir: options['component-dir'],
      packageName: options['package-name'],
      page: options['open'],
      host: options['hostname'],
      browser: options['browser'],
    });
  }
}
