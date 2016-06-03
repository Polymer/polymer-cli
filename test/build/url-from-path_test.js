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
const urlFromPath = require('../../lib/build/url-from-path').default;

const WIN_ROOT_PATH = 'C:\\Users\\TEST_USER\\TEST_ROOT';
const MAC_ROOT_PATH = '/Users/TEST_USER/TEST_ROOT';
var isPlatformWin = /^win/.test(process.platform);

suite('urlFromPath()', () => {

  test('throws error when path is not in root', () => {
    assert.throws(function() {
      urlFromPath(MAC_ROOT_PATH, '/some/other/path/shop-app.html');
    });
  });

  if (isPlatformWin) {

    test('creates a URL path relative to root when called in a Windows environment', () => {
      let shortPath = urlFromPath(WIN_ROOT_PATH, WIN_ROOT_PATH + '\\shop-app.html');
      assert.equal(shortPath, 'shop-app.html');
      let medPath = urlFromPath(WIN_ROOT_PATH, WIN_ROOT_PATH + '\\src\\shop-app.html');
      assert.equal(medPath, 'src/shop-app.html');
      let longPath = urlFromPath(WIN_ROOT_PATH, WIN_ROOT_PATH + '\\bower_components\\app-layout\\docs.html');
      assert.equal(longPath, 'bower_components/app-layout/docs.html');
    });

  } else {

    test('creates a URL path relative to root when called in a Posix environment', () => {
      let shortPath = urlFromPath(MAC_ROOT_PATH, MAC_ROOT_PATH + '/shop-app.html');
      assert.equal(shortPath, 'shop-app.html');
      let medPath = urlFromPath(MAC_ROOT_PATH, MAC_ROOT_PATH + '/src/shop-app.html');
      assert.equal(medPath, 'src/shop-app.html');
      let longPath = urlFromPath(MAC_ROOT_PATH, MAC_ROOT_PATH + '/bower_components/app-layout/docs.html');
      assert.equal(longPath, 'bower_components/app-layout/docs.html');
    });

  }

});
