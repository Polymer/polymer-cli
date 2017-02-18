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

// Note! For this error message to be effective this file must not use >ES5
// syntax, and it must run this before importing anything else, as other
// node modules may use >=ES6 syntax.

var semver = require('semver');
// Early exit if the user's node version is too low.
if (!semver.satisfies(process.version, '>=4')) {
  console.log(
      'Polymer CLI requires at least Node v4. ' +
      'You have ' + process.version + '.');
  process.exit(1);
}

var resolve = require('resolve');
var updateNotifier = require('update-notifier');
var packageJson = require('../package.json');
var logging = require('plylog');

var logger = logging.getLogger('cli.main');

// Update Notifier: Asynchronously check for package updates and, if needed,
// notify on the next time the CLI is run.
// See https://github.com/yeoman/update-notifier#how for how this works.
updateNotifier({pkg: packageJson}).notify();

resolve('polymer-cli', {basedir: process.cwd()}, function(error, path) {
  var lib = path ? require(path) : require('..');
  var args = process.argv.slice(2);
  var cli = new lib.PolymerCli(args);
  cli.run().then(function (result) {
    if (result && result.constructor && result.constructor.name === 'CommandResult') {
      process.exit(result.exitCode);
    }
  }, function (err) {
    logger.error('cli runtime exception: ' + err);
    if (err.stack) {
      logger.error(err.stack);
    }
    process.exit(1);
  });
});
