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
import * as vfs from 'vinyl-fs-fake';

import {getOptimizeStreams} from '../../../build/optimize-streams';
import {pipeStreams} from '../../../build/streams';

suite('optimize-streams', () => {

  async function testStream(stream: NodeJS.ReadableStream): Promise<any> {
    return new Promise((resolve, reject) => {
      stream.on('data', resolve);
      stream.on('error', reject);
    });
  }

  test('compile js', async () => {
    const expected = `var apple = 'apple';var banana = 'banana';`;
    const sourceStream = vfs.src([
      {
        path: 'foo.js',
        contents: `const apple = 'apple'; let banana = 'banana';`,
      },
    ]);
    const op =
        pipeStreams([sourceStream, getOptimizeStreams({js: {compile: true}})]);
    const f = await testStream(op);
    assert.equal(f.contents.toString(), expected);
  });

  test('does not compile webcomponents.js files (windows)', async () => {
    const es6Contents = `const apple = 'apple';`;
    const sourceStream = vfs.src([
      {
        path:
            'A:\\project\\bower_components\\webcomponentsjs\\webcomponents-es5-loader.js',
        contents: es6Contents,
      },
    ]);
    const op =
        pipeStreams([sourceStream, getOptimizeStreams({js: {compile: true}})]);
    const f = await testStream(op);
    assert.equal(f.contents.toString(), es6Contents);
  });

  test('does not compile webcomponents.js files (unix)', async () => {
    const es6Contents = `const apple = 'apple';`;
    const sourceStream = vfs.src([
      {
        path:
            '/project/bower_components/webcomponentsjs/webcomponents-es5-loader.js',
        contents: es6Contents,
      },
    ]);
    const op =
        pipeStreams([sourceStream, getOptimizeStreams({js: {compile: true}})]);
    const f = await testStream(op);
    assert.equal(f.contents.toString(), es6Contents);
  });


  test('minify js', async () => {
    const sourceStream = vfs.src([
      {
        path: 'foo.js',
        contents: 'var foo = 3',
      },
    ]);
    const op =
        pipeStreams([sourceStream, getOptimizeStreams({js: {minify: true}})]);
    const f = await testStream(op);
    assert.equal(f.contents.toString(), 'var foo=3;');
  });

  test('minify js (es6)', async () => {
    const sourceStream = vfs.src([
      {
        path: 'foo.js',
        contents: '[1,2,3].map(n => n + 1);',
      },
    ]);
    const op =
        pipeStreams([sourceStream, getOptimizeStreams({js: {minify: true}})]);
    const f = await testStream(op);
    assert.equal(f.contents.toString(), '[1,2,3].map((a)=>a+1);');
  });

  test('minify html', async () => {
    const expected = `<!doctype html><style>foo {
            background: blue;
          }</style><script>document.registerElement(\'x-foo\', XFoo);</script><x-foo>bar</x-foo>`;
    const sourceStream = vfs.src(
        [
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
        ],
        {cwdbase: true});
    const op =
        pipeStreams([sourceStream, getOptimizeStreams({html: {minify: true}})]);
    const f = await testStream(op);
    assert.equal(f.contents.toString(), expected);
  });

  test('minify css', async () => {
    const sourceStream = vfs.src([
      {
        path: 'foo.css',
        contents: '/* comment */ selector { property: value; }',
      },
    ]);
    const op =
        pipeStreams([sourceStream, getOptimizeStreams({css: {minify: true}})]);
    const f = await testStream(op);
    assert.equal(f.contents.toString(), 'selector{property:value;}');
  });

  test('minify css (inlined)', async () => {
    const expected = `<style>foo{background:blue;}</style>`;
    const sourceStream = vfs.src(
        [
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
        ],
        {cwdbase: true});
    const op =
        pipeStreams([sourceStream, getOptimizeStreams({css: {minify: true}})]);
    const f = await testStream(op);
    assert.include(f.contents.toString(), expected);
  });

});
