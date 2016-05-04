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

const StreamResolver = require('../../lib/build/stream-resolver').StreamResolver;
const assert = require('chai').assert;
const File = require('vinyl');
const Deferred = require('hydrolysis/lib/loader/resolver').Deferred;

suite('streamResolver', () => {

  test('entrypoint is passed through', (done) => {
    let f1 = new File({
      cwd: "/foo/bar",
      base: "/foo/bar",
      path: "/foo/bar/baz.qux",
      contents: null,
    });
    let resolver = new StreamResolver({
      entrypoint: "/foo/bar/baz.qux",
    });
    resolver._transform(f1, 'utf-8', (err, data) => {
      assert.equal(f1, data);
      done();
    });
  });

  test('non-entrypoint is passed through', (done) => {
    let f1 = new File({
      cwd: "/foo/bar",
      base: "/foo/bar",
      path: "/foo/bar/baz.qux",
      contents: null,
    });
    let resolver = new StreamResolver({
      entrypoint: "/foo/bar/entrypoint",
    });
    resolver._transform(f1, 'utf-8', (err, data) => {
      assert.equal(f1, data);
      done();
    });
  });

  test('accept() handles absolute URLs', (done) => {
    let f1 = new File({
      cwd: "/foo/bar",
      base: "/foo/bar",
      path: "/foo/bar/baz.qux",
      contents: new Buffer("abcdefg"),
    });
    let resolver = new StreamResolver({
      root: "/foo/bar",
      base: "/foo/bar",
      entrypoint: "/foo/bar/entrypoint",
    });
    resolver._transform(f1, 'utf-8', (err, data) => {
      assert.equal(null, data);
      let deferred = new Deferred();
      deferred.promise.then((contents) => {
        assert.equal("abcdefg", contents);
        done();
      });
      let accepted = resolver.accept('/baz.qux', deferred);
    });
  });

});
