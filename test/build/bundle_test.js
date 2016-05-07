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
const dom5 = require('dom5');
const File = require('vinyl');
const path = require('path');
const stream = require('stream');

const bundle = require('../../lib/build/bundle');

const Bundler = bundle.Bundler;

const root = '/root';

suite('Bundler', () => {

  let bundler;
  let sourceStream;
  let bundledStream;
  let files;

  let setupTest = (options) => new Promise((resolve, reject) => {
    bundler = new Bundler(root, options.shell, options.entrypoints);
    sourceStream = new stream.Readable({
      objectMode: true,
    });
    bundledStream = sourceStream.pipe(bundler.bundle);
    files = new Map();
    bundledStream.on('data', (file) => {
      files.set(file.path, file);
    });
    bundledStream.on('end', (data) => {
      resolve(files);
    });
    pushFiles(options.files);
  });

  teardown(() => {
    bundler = null;
    sourceStream = null;
    bundledStream = null;
    files = null;
  });

  let pushFiles = (files) => {
    files.forEach((f) => sourceStream.push(f));
    sourceStream.push(null);
  };

  let getFile = (filename) => {
    let file = files.get(path.resolve(root, filename));
    return file && file.contents && file.contents.toString();
  }

  let hasMarker = (doc, id) => {
    let marker = dom5.query(doc,
      dom5.predicates.AND(
        dom5.predicates.hasTagName('div'),
        dom5.predicates.hasAttrValue('id', id)
      ));
    return marker != null;
  };

  let hasImport = (doc, url) => {
    let link = dom5.query(doc,
      dom5.predicates.AND(
        dom5.predicates.hasTagName('link'),
        dom5.predicates.hasAttrValue('rel', 'import'),
        dom5.predicates.hasAttrValue('href', url)
      ));
    return link != null;
  };

  test('shell only', () => setupTest({
    shell: '/root/shell.html',
    files: [framework(), shell()],
  }).then((files) => {
    let doc = dom5.parse(getFile('shell.html'));
    assert.isTrue(hasMarker(doc, 'framework'));
    assert.isFalse(hasImport(doc, '/root/framework.html'));
  }));

  test('shell and 1 entrypoint', () => setupTest({
    shell: '/root/shell.html',
    entrypoints: ['/root/entrypointA.html'],
    files: [framework(), shell(), entrypointA()],
  }).then((files) => {
    // shell doesn't have framework
    let shellDoc = dom5.parse(getFile('shell.html'));
    assert.isFalse(hasMarker(shellDoc, 'framework'));
    assert.isFalse(hasImport(shellDoc, '/root/framework.html'));

    // entrypoint doesn't have framework
    let entrypointDoc = dom5.parse(getFile('entrypointA.html'));
    assert.isFalse(hasMarker(entrypointDoc, 'framework'));
    assert.isFalse(hasImport(entrypointDoc, '/root/framework.html'));

    // shared-bundle has framework
    let sharedDoc = dom5.parse(getFile('shared-bundle.html'));
    assert.isTrue(hasMarker(sharedDoc, 'framework'));
    assert.isFalse(hasImport(sharedDoc, '/root/framework.html'));
  }));

});

const F = (filename, contents) => new File({
  cwd: root,
  base: root,
  path: path.resolve(root, filename),
  contents: new Buffer(contents),
});

const framework = () => F('framework.html', `
<div id="framework"></div>
`);

const shell = () => F('shell.html', `
<link rel="import" href="framework.html">
<div id="shell"></div>
`);

const entrypointA = () => F('entrypointA.html', `
<link rel="import" href="framework.html">
<div id="entrypointA"></div>
`);
