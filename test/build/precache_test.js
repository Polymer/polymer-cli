/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

'use strict';

const assert = require('chai').assert;
const path = require('path');

const precache = require('../../lib/build/sw-precache');

suite('sw-precache', () => {
  suite('parsePreCacheConfig()', () => {
    test('should parse a js file', (done) => {
      const configFile = path.resolve(__dirname, 'precache', 'config.js');
      precache.parsePreCacheConfig(configFile).then((config) => {
        assert.ok(config);
        assert.property(config, 'staticFileGlobs');
        done();
      })
    });
  });
});
