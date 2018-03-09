/*
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

'use strict';

import {assert} from 'chai';
import * as path from 'path';
import * as tmp from 'tmp';
import * as fs from 'fs-extra';
import {runCommand} from './run-command';

const fixturePath = path.join(
    __dirname, '../../../src/test/integration/fixtures/install-variants');

suite('install-variants', function() {

  const binPath = path.join(__dirname, '../../../bin/polymer.js');

  this.timeout(5 * 1000);

  test('installs variants', async () => {

    const tmpPath = tmp.dirSync().name;
    fs.copySync(fixturePath, tmpPath, {});

    const env = envExcludingBowerVars();
    await runCommand(
        binPath, ['install', '--variants', '--offline'], {cwd: tmpPath, env});

    const mainDir = path.join(tmpPath, 'bower_components');
    assert.isTrue(fs.statSync(mainDir).isDirectory());

    const variant1Dir = path.join(tmpPath, 'bower_components-variant-1');
    assert.isTrue(fs.statSync(variant1Dir).isDirectory());

    const variant2Dir = path.join(tmpPath, 'bower_components-variant-1');
    assert.isTrue(fs.statSync(variant2Dir).isDirectory());
  });

});

/**
 * Constructs a version of process.env with all bower_* keys blanked out.
 *
 * This is to override the bower cache options on travis so that our local
 * cache is used in fixtures/install-variants/bower_cache
 */
function envExcludingBowerVars() {
  const env: {[envVar: string]: string} = {};
  for (const envVar of Object.keys(process.env)) {
    if (!envVar.startsWith('bower_')) {
      env[envVar] = process.env[envVar];
    } else {
      env[envVar] = '';
    }
  }
  return env;
}
