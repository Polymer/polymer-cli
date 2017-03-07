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
const getOptimizeStreams = require('../../../lib/build/optimize-streams').getOptimizeStreams;
const pipeStreams = require('../../../lib/build/streams').pipeStreams;

suite('optimize-streams', () => {

  function testStream(stream, cb) {
    stream.on('data', (data) => {
      cb(null, data)
    });
    stream.on('error', cb);
  }

  test('compile js', (done) => {
    const expected = `var apple = 'apple';var banana = 'banana';`;
    const sourceStream = vfs.src([
      {
        path: 'foo.js',
        contents: `const apple = 'apple'; let banana = 'banana';`,
      },
    ]);
    const op = pipeStreams([sourceStream, getOptimizeStreams({js: {compile: true}})]);
    testStream(op, (error, f) => {
      if (error) {
        return done(error);
      }
      assert.equal(f.contents.toString(), expected);
      done();
    });
  });

  test('does not compile webcomponents.js files (windows)', (done) => {
    const es6Contents = `const apple = 'apple';`;
    const sourceStream = vfs.src([
      {
        path: 'A:\\project\\bower_components\\webcomponentsjs\\webcomponents-es5-loader.js',
        contents: es6Contents,
      },
    ]);
    const op = pipeStreams([sourceStream, getOptimizeStreams({js: {compile: true}})]);
    testStream(op, (error, f) => {
      if (error) {
        return done(error);
      }
      assert.equal(f.contents.toString(), es6Contents);
      done();
    });
  });

  test('does not compile webcomponents.js files (unix)', (done) => {
    const es6Contents = `const apple = 'apple';`;
    const sourceStream = vfs.src([
      {
        path: '/project/bower_components/webcomponentsjs/webcomponents-es5-loader.js',
        contents: es6Contents,
      },
    ]);
    const op = pipeStreams([sourceStream, getOptimizeStreams({js: {compile: true}})]);
    testStream(op, (error, f) => {
      if (error) {
        return done(error);
      }
      assert.equal(f.contents.toString(), es6Contents);
      done();
    });
  });


  test('minify js', (done) => {
    const sourceStream = vfs.src([
      {
        path: 'foo.js',
        contents: 'var foo = 3',
      },
    ]);
    const op = pipeStreams([sourceStream, getOptimizeStreams({js: {minify: true}})]);
    testStream(op, (error, f) => {
      if (error) {
        return done(error);
      }
      assert.equal(f.contents.toString(), 'var foo=3;');
      done();
    });
  });

  test('minify js (es6)', (done) => {
    const sourceStream = vfs.src([
      {
        path: 'foo.js',
        contents: '[1,2,3].map(n => n + 1);',
      },
    ]);
    const op = pipeStreams([sourceStream, getOptimizeStreams({js: {minify: true}})]);
    testStream(op, (error, f) => {
      if (error) {
        return done(error);
      }
      assert.equal(f.contents.toString(), '[1,2,3].map(a=>a+1);');
      done();
    });
  });

  test('minify html', (done) => {
    const expected =
      `<!doctype html><style>foo {
            background: blue;
          }</style><script>document.registerElement(\'x-foo\', XFoo);</script><x-foo>bar</x-foo>`;
    const sourceStream = vfs.src([
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
    const op = pipeStreams([sourceStream, getOptimizeStreams({html: {minify: true}})]);
    testStream(op, (error, f) => {
      if (error) {
        return done(error);
      }
      assert.equal(f.contents.toString(), expected);
      done();
    });
  });

  test('minify css', (done) => {
    const sourceStream = vfs.src([
      {
        path: 'foo.css',
        contents: '/* comment */ selector { property: value; }',
      },
    ]);
    const op = pipeStreams([sourceStream, getOptimizeStreams({css: {minify: true}})]);
    testStream(op, (error, f) => {
      if (error) {
        return done(error);
      }
      assert.equal(f.contents.toString(), 'selector{property:value;}');
      done();
    });
  });

  test('minify css (inlined)', (done) => {
    const expected =`<style>foo{background:blue;}</style>`;
    const sourceStream = vfs.src([
      {
        path: 'foo.html',
        contents: `
          <!doctype html>
          <html>
            <head>
              <style>
                foo {
                  background: blue;
                }
              </style>
            </head>
            <body></body>
          </html>
        `,
      },
    ], {cwdbase: true});
    const op = pipeStreams([sourceStream, getOptimizeStreams({css: {minify: true}})]);
    testStream(op, (error, f) => {
      if (error) {
        return done(error);
      }
      assert.include(f.contents.toString(), expected);
      done();
    });
  });

});
