/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

'use strict';

const assert = require('chai').assert;
const createLinks = require('../../../lib/build/prefetch').createLinks;

suite('prefetch', () => {

  suite('createLinks', () => {
    const html = '<html><body>foo</body></html>';
    const deps = [
      'bower_components/polymer/polymer.html',
      'src/my-icons.html',
    ];

    test('with rel import', () => {
      const url = 'src/my-app.html';
      const expected =
          ('<html><head>' +
           '<link rel="import" href="../bower_components/polymer/polymer.html">' +
           '<link rel="import" href="my-icons.html">' +
           '</head><body>foo</body></html>');
      const actual = createLinks(html, url, deps, 'import')
      assert.equal(actual, expected);
    });

    test('with rel prefetch', () => {
      const url = 'index.html';
      const expected =
          ('<html><head>' +
           '<link rel="prefetch" href="/bower_components/polymer/polymer.html">' +
           '<link rel="prefetch" href="/src/my-icons.html">' +
           '</head><body>foo</body></html>');
      const actual = createLinks(html, url, deps, 'prefetch')
      assert.equal(actual, expected);
    });
  });
});
