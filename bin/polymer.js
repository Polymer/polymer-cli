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

// Ok, safe to use ES6.
require('../lib/run');
