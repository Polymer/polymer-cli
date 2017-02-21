/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
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
import * as resolve from 'resolve';
import * as updateNotifier from 'update-notifier';
import * as cliTypeOnly from './polymer-cli';

const packageJson = require('../package.json');

const logger = logging.getLogger('cli.main');


// Update Notifier: Asynchronously check for package updates and, if needed,
// notify on the next time the CLI is run.
// See https://github.com/yeoman/update-notifier#how for how this works.
updateNotifier({pkg: packageJson}).notify();

resolve('polymer-cli', {basedir: process.cwd()}, async(_error, path) => {
  const lib: typeof cliTypeOnly = path ? require(path) : require('..');
  const args = process.argv.slice(2);
  const cli = new lib.PolymerCli(args);
  try {
    const result = await cli.run();
    if (result && result.constructor &&
        result.constructor.name === 'CommandResult') {
      process.exit(result.exitCode);
    }
  } catch (err) {
    logger.error('cli runtime exception: ' + err);
    if (err.stack) {
      logger.error(err.stack);
    }
    process.exit(1);
  }
});
