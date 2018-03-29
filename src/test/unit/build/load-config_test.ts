/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {assert} from 'chai';
import * as path from 'path';
import {loadServiceWorkerConfig} from '../../../build/load-config';

suite('load-config', () => {
  suite('loadServiceWorkerConfig()', () => {
    test('should parse the given js file', async () => {
      const configFile = path.resolve(
          __dirname, '../', 'fixtures', 'service-worker-config.js');
      const config = await loadServiceWorkerConfig(configFile);
      assert.ok(config);
      assert.deepEqual(config!.staticFileGlobs, ['*']);
    });
  });
});
