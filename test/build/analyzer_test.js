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
const StreamAnalyzer = require('../../lib/build/analyzer').StreamAnalyzer;
const vfs = require('vinyl-fs-fake');

suite('Analyzer', () => {

  suite('DepsIndex', () => {

    test('fragment to deps list has only uniques', (done) => {
      let root = path.resolve('test/build/analyzer');
      let analyzer = new StreamAnalyzer(root, null, null, [
        path.resolve(root, 'a.html'),
        path.resolve(root, 'b.html'),
      ]);
      vfs.src(path.join(root, '**'), {cwdbase: true})
        .pipe(analyzer)
        .on('finish', () => {
          analyzer.analyze.then((depsIndex) => {
            let ftd = depsIndex.fragmentToDeps;
            for (let frag of ftd.keys()) {
              assert.deepEqual(ftd.get(frag), ['shared-1.html', 'shared-2.html']);
            }
            done();
          }).catch((err) => done(err));
      });
    });

    test("analyzing shell and entrypoint doesn't double load files", (done) => {
      let root = path.resolve('test/build/analyzer');
      let analyzer = new StreamAnalyzer(
          root,
          path.resolve(root, 'entrypoint.html'),
          path.resolve(root, 'shell.html'));
      vfs.src(root + '/**', {cwdbase: true})
        .pipe(analyzer)
        .on('finish', () => {
          analyzer.analyze.then((depsIndex) => {
            assert.isTrue(depsIndex.depsToFragments.has('shared-2.html'));
            assert.isFalse(depsIndex.depsToFragments.has('/shell.html'));
            assert.isFalse(depsIndex.depsToFragments.has('/shared-2.html'));
            done();
          }).catch((err) => done(err));
      });
    });

  });

});
