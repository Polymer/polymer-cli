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

const loadServiceWorkerConfig = require('../../../lib/build/load-config').loadServiceWorkerConfig;

suite('load-config', () => {
  suite('loadServiceWorkerConfig()', () => {
    test('should parse the given js file', (done) => {
      const configFile = path.resolve(__dirname, '../', 'fixtures', 'service-worker-config.js');
      loadServiceWorkerConfig(configFile).then((config) => {
        assert.ok(config);
        assert.deepEqual(config.staticFileGlobs, ['*']);
        done();
      })
    });
  });
});
