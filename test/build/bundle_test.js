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

const analyzer = require('../../lib/build/analyzer');
const bundle = require('../../lib/build/bundle');

const Bundler = bundle.Bundler;
const StreamAnalyzer = analyzer.StreamAnalyzer;

const root = path.resolve('/root');
var isPlatformWin = /^win/.test(process.platform);

suite('Bundler', () => {

  let bundler;
  let sourceStream;
  let bundledStream;
  let files;

  let setupTest = (options) => new Promise((resolve, reject) => {
    let fragments = options.fragments
        ? options.fragments.map((f) => path.resolve(root, f))
        : [];
    let entrypoint = options.entrypoint
        && path.resolve(root, options.entrypoint);
    let shell = options.shell
        && path.resolve(root, options.shell);
    let analyzer = new StreamAnalyzer(root, entrypoint, shell, fragments);
    bundler = new Bundler(root, entrypoint, shell, fragments, analyzer);
    sourceStream = new stream.Readable({
      objectMode: true,
    });
    bundledStream = sourceStream
        .pipe(analyzer)
        .pipe(bundler);
    files = new Map();
    bundledStream.on('data', (file) => {
      files.set(file.path, file);
    });
    bundledStream.on('end', (data) => {
      resolve(files);
    });
    bundledStream.on('error', (err) => {
      reject(err);
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
    // we're getting FS paths, so add root
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

  suite('urlFromPath()', () => {

    // TODO(fschott): Get path-related tests working in multiple environments
    if(!isPlatformWin) {
      test('creates a URL path relative to root when called with a file path', () => setupTest({
        entrypoint: 'entrypointA.html',
        files: [framework(), entrypointA()],
      }).then((files) => {
        let urlPath = bundler.urlFromPath('/root/src/123.html');
        assert.equal(urlPath, 'src/123.html');
      }));
    }

  });

  test('entrypoint only', () => setupTest({
    entrypoint: 'entrypointA.html',
    files: [framework(), entrypointA()],
  }).then((files) => {
    let doc = dom5.parse(getFile('entrypointA.html'));
    assert.isTrue(hasMarker(doc, 'framework'));
    assert.isFalse(hasImport(doc, 'framework.html'));
    // TODO(justinfagnani): check that shared-bundle.html doesn't exist
    // it's in the analyzer's file map for some reason
  }));

  test('two fragments', () => setupTest({
    fragments: ['shell.html', 'entrypointA.html'],
    files: [framework(), shell(), entrypointA()],
  }).then((files) => {
    // shell doesn't import framework
    let shellDoc = dom5.parse(getFile('shell.html'));
    assert.isFalse(hasMarker(shellDoc, 'framework'));
    assert.isFalse(hasImport(shellDoc, 'framework.html'));

    // entrypoint doesn't import framework
    let entrypointDoc = dom5.parse(getFile('entrypointA.html'));
    assert.isFalse(hasMarker(entrypointDoc, 'framework'));
    assert.isFalse(hasImport(entrypointDoc, 'framework.html'));

    // No shared-bundle bundles framework
    let sharedDoc = dom5.parse(getFile('shared-bundle.html'));
    assert.isTrue(hasMarker(sharedDoc, 'framework'));
    assert.isFalse(hasImport(sharedDoc, 'framework.html'));

    // fragments import shared-bundle
    assert.isTrue(hasImport(entrypointDoc, 'shared-bundle.html'));
    assert.isTrue(hasImport(shellDoc, 'shared-bundle.html'));
  }));

  test.skip('shell and entrypoint', () => setupTest({
    entrypoint: '/root/entrypointA.html',
    shell: '/root/shell.html',
    files: [framework(), shell(), entrypointA()],
  }).then((files) => {
    // shell bundles framework
    let shellDoc = dom5.parse(getFile('shell.html'));
    assert.isTrue(hasMarker(shellDoc, 'framework'));
    assert.isFalse(hasImport(shellDoc, '/root/framework.html'));

    // entrypoint doesn't import framework
    let entrypointDoc = dom5.parse(getFile('entrypointA.html'));
    assert.isFalse(hasMarker(entrypointDoc, 'framework'));
    assert.isFalse(hasImport(entrypointDoc, '/root/framework.html'));

    // entrypoint imports shell
    assert.isTrue(hasImport(entrypointDoc, 'shell.html'));

    // No shared-bundle with a shell
    assert.isNotOk(getFile('shared-bundle.html'));
  }));

  test('shell and fragments with shared dependency', () => setupTest({
    shell: 'shell.html',
    fragments: ['entrypointB.html', 'entrypointC.html'],
    files: [framework(), shell(), entrypointB(), entrypointC(), commonDep()],
  }).then((files) => {
    // shell bundles framework
    let shellDoc = dom5.parse(getFile('shell.html'));
    assert.isTrue(hasMarker(shellDoc, 'framework'));
    assert.isFalse(hasImport(shellDoc, 'framework.html'));

    // shell bundles commonDep
    assert.isTrue(hasMarker(shellDoc, 'commonDep'));
    assert.isFalse(hasImport(shellDoc, 'commonDep.html'));

    // entrypoint B doesn't import commonDep
    let entrypointBDoc = dom5.parse(getFile('entrypointB.html'));
    assert.isFalse(hasMarker(entrypointBDoc, 'commonDep'));
    assert.isFalse(hasImport(entrypointBDoc, 'commonDep.html'));

    // entrypoint C doesn't import commonDep
    let entrypointCDoc = dom5.parse(getFile('entrypointC.html'));
    assert.isFalse(hasMarker(entrypointCDoc, 'commonDep'));
    assert.isFalse(hasImport(entrypointCDoc, 'commonDep.html'));

    // entrypoints import shell
    assert.isTrue(hasImport(entrypointBDoc, 'shell.html'));
    assert.isTrue(hasImport(entrypointCDoc, 'shell.html'));

    // No shared-bundle with a shell
    assert.isNotOk(getFile('shared-bundle.html'));
  }));

  test.skip('entrypoint and fragments', () => setupTest({
    entrypoint: '/root/entrypointA.html',
    fragments: ['/root/shell.html', '/root/entrypointB.html', '/root/entrypointC.html'],
    files: [framework(), shell(), entrypointA(), entrypointB(), entrypointC(), commonDep()],
  }).then((files) => {
    // shared bundle was emitted
    let bundle = getFile('shared-bundle.html');
    assert.ok(bundle);
    let bundleDoc = dom5.parse(bundle);

    // shared-bundle bundles framework
    assert.isTrue(hasMarker(bundleDoc, 'framework'));
    assert.isFalse(hasImport(bundleDoc, '/root/framework.html'));

    // shared-bundle bundles commonDep
    assert.isTrue(hasMarker(bundleDoc, 'commonDep'));
    assert.isFalse(hasImport(bundleDoc, '/root/commonDep.html'));

    // entrypoint doesn't import framework
    let entrypointDoc = dom5.parse(getFile('entrypointA.html'));
    assert.isFalse(hasMarker(entrypointDoc, 'framework'));
    assert.isFalse(hasImport(entrypointDoc, '/root/framework.html'));

    // shell doesn't import framework
    let shellDoc = dom5.parse(getFile('entrypointA.html'));
    assert.isFalse(hasMarker(shellDoc, 'framework'));
    assert.isFalse(hasImport(shellDoc, '/root/framework.html'));

    // entrypoint B doesn't import commonDep
    let entrypointBDoc = dom5.parse(getFile('entrypointB.html'));
    assert.isFalse(hasMarker(entrypointBDoc, 'commonDep'));
    assert.isFalse(hasImport(entrypointBDoc, '/root/commonDep.html'));

    // entrypoint C doesn't import commonDep
    let entrypointCDoc = dom5.parse(getFile('entrypointC.html'));
    assert.isFalse(hasMarker(entrypointCDoc, 'commonDep'));
    assert.isFalse(hasImport(entrypointCDoc, '/root/commonDep.html'));

    // entrypoint and fragments import shared-bundle
    assert.isTrue(hasImport(entrypointDoc, 'shared-bundle.html'));
    assert.isTrue(hasImport(entrypointBDoc, 'shared-bundle.html'));
    assert.isTrue(hasImport(entrypointCDoc, 'shared-bundle.html'));
    assert.isTrue(hasImport(shellDoc, 'shared-bundle.html'));
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

const entrypointB = () => F('entrypointB.html', `
<link rel="import" href="commonDep.html">
<div id="entrypointB"></div>
`);

const entrypointC = () => F('entrypointC.html', `
<link rel="import" href="commonDep.html">
<div id="entrypointC"></div>
`);

const commonDep = () => F('commonDep.html', `
<div id="commonDep"></div>
`);
