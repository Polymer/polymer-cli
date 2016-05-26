/*
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

'use strict';

const yoAssert = require('yeoman-assert');
const helpers = require('yeoman-test');
const ApplicationGenerator
  = require('../../lib/init/application/application').ApplicationGenerator;

suite('init/application', () => {

  test('creates expected files while ignoring filenames with dangling underscores', (done) => {

    helpers
      .run(ApplicationGenerator)
      .on('end', (a) => {
        yoAssert.file(['bower.json']);
        yoAssert.noFile(['src/_element/_element.html']);
        done();
      });

  });

});
