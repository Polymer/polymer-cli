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

/*
 * NOTE: The contents of this file should work on as many version of Node.js
 * as possible. This means it *can not* use any >ES5 syntax and features.
 * Other files, which may use >=ES2015 syntax, should only be loaded
 * asynchronously after this version check has been performed.
 */

// NOTE 04-21-2017: Confirmed "semver" supports Node versions as low as 0.10
var semver = require('semver');
var version = require('../package.json').engines.node;

// Exit early if the user's node version is too low.
if (!semver.satisfies(process.version, version)) {
  // Strip version range characters leaving the raw semantic version for output
  var rawVersion = version.replace(/[^\d\.]*/, '');
  console.log(
      'Polymer CLI requires at least Node v' + rawVersion + '. ' +
      'You have ' + process.version + '.\n' +
      'See https://www.polymer-project.org/2.0/docs/tools/node-support ' +
      'for details.');
  process.exit(1);
}

// Ok, safe to load ES2015.
require('../lib/run');
