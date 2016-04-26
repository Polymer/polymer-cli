/*
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

'use strict';

const assert = require('chai').assert;
const fs = require('fs');
const path = require('path');
const streamLib = require('stream');
const yoAssert = require('yeoman-assert');
const helpers = require('yeoman-test');

const polykart = require('../../lib/templates/polykart.js');

suite('templates/polykart', () => {

  test('untars a release', (done) => {
    let mockRequestApi = (options) => {
      assert.equal(options.url, 'http://foo.com/bar.tar');
      return fs.createReadStream(path.join(__dirname, 'test_tarball.tgz'));
    };

    let mockGithubApi = {
      authenticate(options) {
        assert.equal(options.type, 'oauth');
        assert.equal(options.token, 'token-token');
      },

      releases: {
        listReleases(options, cb) {
          assert.equal(options.owner, 'PolymerLabs');
          assert.equal(options.repo, 'polykart');
          cb(null, [{
            tarball_url: 'http://foo.com/bar.tar',
          }]);
        },
      },
    };

    let generator = new polykart.getGenerator({
      requestApi: mockRequestApi,
      githubApi: mockGithubApi,
      githubToken: 'token-token',
    });

    helpers.run(generator)
      .on('end', (a) => {
        yoAssert.file(['file1.txt']);
        done();
      });
  });

});
