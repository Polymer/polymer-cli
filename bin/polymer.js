#!/usr/bin/env node

'use strict';

/**
 * @license
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
process.title = 'polymer';

const resolve = require('resolve');
const updateNotifier = require('update-notifier');
const packageJson = require('../package.json');
const logging = require('plylog');

const logger = logging.getLogger('cli.main');

// Update Notifier: Asynchronously check for package updates and, if needed,
// notify on the next time the CLI is run.
// See https://github.com/yeoman/update-notifier#how for how this works.
updateNotifier({pkg: packageJson}).notify();

resolve('polymer-cli', {basedir: process.cwd()}, function(error, path) {
  let lib = path ? require(path) : require('..');
  let args = process.argv.slice(2);
  let cli = new lib.PolymerCli(args);
  cli.run().catch((err) => {
    logger.error(`cli runtime exception: ${err}`);
    if (err.stack) {
      logger.error(err.stack);
    }
    process.exit(1);
  });
});
