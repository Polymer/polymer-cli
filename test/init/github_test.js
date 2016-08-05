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
const fs = require('fs-extra');
const path = require('path');
const yoAssert = require('yeoman-assert');
const helpers = require('yeoman-test');

const createGithubGenerator
  = require('../../lib/init/github').createGithubGenerator;

suite('init/github', () => {

  test('untars a release', (done) => {
    let mockRequestApi = (options) => {
      assert.equal(options.url, 'http://foo.com/bar.tar');
      return fs.createReadStream(
        path.join(__dirname, 'github-test-data/test_tarball.tgz'));
    };

    let mockGithubApi = {
      authenticate(options) {
        assert.equal(options.type, 'oauth');
        assert.equal(options.token, 'token-token');
      },

      repos: {
        getReleases(options, cb) {
          assert.equal(options.user, 'PolymerLabs');
          assert.equal(options.repo, 'polykart');
          cb(null, [{
            tarball_url: 'http://foo.com/bar.tar',
          }]);
        },
      },
    };

    let generator = new createGithubGenerator({
      requestApi: mockRequestApi,
      githubApi: mockGithubApi,
      githubToken: 'token-token',
      owner: 'PolymerLabs',
      repo: 'polykart',
    });

    helpers.run(generator)
      .on('end', (a) => {
        yoAssert.file(['file1.txt']);
        done();
      });
  });

  test('works when package.json with no name is present', (done) => {
    let mockRequestApi = (options) => {
      throw new Error('should have errored earlier');
    };

    let mockGithubApi = {
      authenticate(options) {
      },

      repos: {
        getReleases(options, cb) {
          // If we got to this point, the test passed. Abort.
          throw new Error('expected');
        },
      },
    };

    let generator = new createGithubGenerator({
      requestApi: mockRequestApi,
      githubApi: mockGithubApi,
      githubToken: 'token-token',
      owner: 'PolymerLabs',
      repo: 'polykart',
    });

    helpers.run(generator)
      .inTmpDir((dir) => {
        fs.copySync(
          path.join(__dirname, 'github-test-data/package.json'),
          path.join(dir, 'package.json')
        );
      })
      .on('error', (error) => {
        assert.equal(error.message, 'expected');
        done();
      })
      .on('end', (a) => {
        assert.fail();
        done();
      });
  });

});
