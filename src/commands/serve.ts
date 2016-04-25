/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {startServer, args as polyserveArgs} from 'polyserve';
import {ServerOptions} from 'polyserve/lib/start_server';
import {Command} from './command';

export class ServeCommand implements Command {
  name = 'serve';

  description = 'Runs the polyserve development server';

  args = polyserveArgs;

  run(options): Promise<any> {
    var serverOptions: ServerOptions = {
      root: options.root,
      port: options.port,
      hostname: options.hostname,
      open: options.open,
      browser: options.browser,
      componentDir: options['component-dir'],
      packageName: options['package-name'],
    }

    return startServer(serverOptions);
  }
}
