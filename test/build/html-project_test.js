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
const path = require('path');
const stream = require('stream');
const File = require('vinyl');

const HtmlProject = require('../../lib/build/html-project').HtmlProject;

suite('HtmlProject', () => {

  test('deals with bad paths', (done) => {
    let project = new HtmlProject();
    let sourceStream = new stream.Readable({
      objectMode: true,
    });
    let root = path.normalize('/foo');
    let filepath = path.join(root, '/bar/baz.html');
    let source =
      '<html><head><script>fooify();</script></head><body></body></html>';
    let file = new File({
      cwd: root,
      base: root,
      path: filepath,
      contents: new Buffer(source),
    });

    sourceStream
      .pipe(project.split)
      .on('data', (file) => {
        // this is what gulp-html-minifier does...
        if (path.sep === '\\' && file.path.endsWith('.html')) {
          file.path = file.path.replace('\\', '/');
        }
      })
      .pipe(project.rejoin)
      .on('data', (file) => {
        let contents = file.contents.toString();
        assert.equal(contents, source);
      })
      .on('finish', () => done())
      .on('error', (error) => done(error));

    sourceStream.push(file);
    sourceStream.push(null);
  });

});
