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

  test('installs variants', (done) => {
    const fixturePath = path.join(__dirname, './fixtures/install-variants');

    tmp.dir((err, tmpPath, cleanup) => {
      fs.copy(fixturePath, tmpPath, {}, (err) => {
        if (err) {
          assert.fail(err);
          done(err);
        }
        runCommand(binPath, ['install', '--variants', '--offline'], {cwd: tmpPath}).then(() => {
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
