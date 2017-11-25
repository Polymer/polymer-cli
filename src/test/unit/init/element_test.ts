/*
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {assert} from 'chai';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as yoAssert from 'yeoman-assert';
import * as helpers from 'yeoman-test';
import {createElementGenerator} from '../../../init/element/element';

suite('init/element', () => {

  let testName =
      'creates expected 1.x files while passed the 1.x template name';
  test(testName, (done) => {
    const TestGenerator = createElementGenerator('polymer-1.x');
    helpers.run(TestGenerator)
        .withPrompts({name: 'foobar-element'})
        .on('end', () => {
          yoAssert.file(['bower.json']);
          yoAssert.fileContent('foobar-element.html', 'Polymer({');
          done();
        });
  });

  testName = 'creates expected 2.x files while passed the 2.x template name';
  test(testName, (done) => {
    const TestGenerator = createElementGenerator('polymer-2.x');
    helpers.run(TestGenerator)
        .withPrompts({name: 'foobar-element'})
        .on('end', () => {
          yoAssert.file(['bower.json']);
          yoAssert.fileContent(
              'foobar-element.html',
              'class FoobarElement extends Polymer.Element');
          done();
        });
  });

  testName =
      'ignoring filenames with dangling underscores when generating templates';
  test(testName, (done) => {
    const TestGenerator = createElementGenerator('polymer-1.x');
    helpers.run(TestGenerator).on('end', () => {
      yoAssert.noFile(['_element.html']);
      done();
    });
  });

  test('works when package.json with no name is present', (done) => {
    const TestGenerator = createElementGenerator('polymer-1.x');
    helpers.run(TestGenerator)
        .inTmpDir((tempDir) => {
          fs.writeFileSync(path.join(tempDir, 'package.json'), '{}');
        })
        .on('error',
            () => {
              assert.fail();
              done();
            })
        .on('end', () => {
          done();
        });
  });


});
