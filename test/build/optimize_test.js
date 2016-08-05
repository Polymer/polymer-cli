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
const vfs = require('vinyl-fs-fake');
const optimizeStreams = require('../../lib/build/optimize-streams');

const JSOptimizeStream = optimizeStreams.JSOptimizeStream;
const CSSOptimizeStream = optimizeStreams.CSSOptimizeStream;
const HTMLOptimizeStream = optimizeStreams.HTMLOptimizeStream;

suite('optimize-streams', () => {

  function testStream(stream, cb) {
    stream.on('data', (data) => {
      cb(null, data)
    });
    stream.on('error', cb);
  }

  test('css', (done) => {
    let stream = vfs.src([
      {
        path: 'foo.css',
        contents: '/* comment */ selector { property: value; }',
      },
    ]);
    let op = stream.pipe(new CSSOptimizeStream({stripWhitespace: true}));
    assert.notEqual(stream, op, 'stream should be wrapped');
    testStream(op, (error, f) => {
      if (error) {
        return done(error);
      }
      assert.equal(f.contents.toString(), 'selector{property:value;}');
      done();
    });
  });

  test('js', (done) => {
    let stream = vfs.src([
      {
        path: 'foo.js',
        contents: 'var foo = 3',
      },
    ]);
    let op = stream.pipe(new JSOptimizeStream({minify: true}));
    assert.notEqual(stream, op);
    testStream(op, (error, f) => {
      if (error) {
        return done(error);
      }
      assert.equal(f.contents.toString(), 'var foo=3;');
      done();
    });
  });

  test('html', (done) => {
    let expected =
      `<!doctype html><style>foo {
            background: blue;
          }</style><script>document.registerElement(\'x-foo\', XFoo);</script><x-foo>bar</x-foo>`;
    let stream = vfs.src([
      {
        path: 'foo.html',
        contents: `
        <!doctype html>
        <style>
          foo {
            background: blue;
          }
        </style>
        <script>
          document.registerElement('x-foo', XFoo);
        </script>
        <x-foo>
          bar
        </x-foo>
        `,
      },
    ], {cwdbase: true});
    let options = {
      collapseWhitespace: true,
      removeComments: true,
    };
    let op = stream.pipe(new HTMLOptimizeStream(options));
    testStream(op, (error, f) => {
      if (error) {
        return done(error);
      }
      assert.equal(f.contents.toString(), expected);
      done();
    });
  });
});
