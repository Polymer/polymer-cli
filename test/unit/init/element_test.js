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
const fs = require('fs-extra');
const path = require('path');
const yoAssert = require('yeoman-assert');
const helpers = require('yeoman-test');
const ElementGenerator
  = require('../../../lib/init/element/element').ElementGenerator;

suite('init/element', () => {

  test('creates expected files while ignoring filenames with dangling underscores', (done) => {

    helpers
      .run(ElementGenerator)
      .on('end', (a) => {
        yoAssert.file(['bower.json']);
        yoAssert.noFile(['_element.html']);
        done();
      });

  });

  test('works when package.json with no name is present', (done) => {

    helpers
      .run(ElementGenerator)
      .inTmpDir((dir) => {
        fs.copySync(
          path.join(__dirname, 'github-test-data/package.json'),
          path.join(dir, 'package.json')
        );
      })
      .on('error', (error) => {
        assert.fail();
        done();
      })
      .on('end', (a) => {
        done();
      });
  });


});
