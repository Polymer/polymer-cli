/*
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
const tmp = require('tmp');
const fs = require('fs-extra');

const runCommand = require('./run-command').runCommand;

suite('install-variants', function() {

  const binPath = path.join(__dirname, '../../bin/polymer.js');

  this.timeout(5 * 1000);

  test('installs variants', (done) => {
    const fixturePath = path.join(__dirname, './fixtures/install-variants');

    tmp.dir((err, tmpPath, cleanup) => {
      fs.copy(fixturePath, tmpPath, {}, (err) => {
        if (err) {
          assert.fail(err);
          done(err);
        }

        const env = envExcludingBowerVars();
        runCommand(binPath, ['install', '--variants', '--offline'], { cwd: tmpPath, env }).then(() => {
          const mainDir = path.join(tmpPath, 'bower_components');
          assert.isTrue(fs.statSync(mainDir).isDirectory());

          const variant1Dir = path.join(tmpPath, 'bower_components-variant-1');
          assert.isTrue(fs.statSync(variant1Dir).isDirectory());

          const variant2Dir = path.join(tmpPath, 'bower_components-variant-1');
          assert.isTrue(fs.statSync(variant2Dir).isDirectory());
          done();
        }).catch((e) => {
          done(e);
        });
      });
    });
  });

});

/**
 * Constructs a version of process.env with all bower_* keys blanked out.
 *
 * This is to override the bower cache options on travis so that our local
 * cache is used in fixtures/install-variants/bower_cache
 */
function envExcludingBowerVars() {
  const env = {};
  for (const envVar of Object.keys(process.env)) {
    if (!envVar.startsWith('bower_')) {
      env[envVar] = process.env[envVar];
    } else {
      env[envVar] = '';
    }
  }
  return env;
}
