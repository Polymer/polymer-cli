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
const File = require('vinyl');
const UglifyTransform = require('../../lib/build/uglify-stream').UglifyTransform;
suite('Uglify Transform', () => {
  let ut;
  setup(() => {
    ut = new UglifyTransform();
  })
  test('always pass through files, even non-js', (done) => {
    let f1 = new File({
      cwd: '/foo/bar',
      base: '/foo/bar',
      path: '/foo/bar/baz.zizz',
      contents: null
    })
    ut._transform(f1, 'utf8', (err, data) => {
      if (err) {
        return done(err)
      }
      assert.equal(data, f1)
      done();
    });
  });

  test('minify js files', (done) => {
    let b = new Buffer('var foo = 3');
    let f1 = new File({
      path: '/foo/bar/baz.js',
      contents: b
    });
    ut._transform(f1, 'utf8', (err, data) => {
      if (err) {
        return done(err);
      }
      // buffer should be different if uglify processed f1 correctly
      assert.notEqual(data.contents.toString(), b.toString());
      done();
    });
  });

  test('continue on JS errors', (done) => {
    let b = new Buffer('####');
    let f1 = new File({
      path: '/foo.js',
      contents: b
    });
    ut._transform(f1, 'utf8', (err, data) => {
      if (err) {
        done(err);
      }
      assert.equal(b, data.contents);
      done();
    });
  });
});
