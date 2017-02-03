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
const sinon = require('sinon');
const fs = require('fs-extra');
const path = require('path');
const temp = require('temp').track();
const PassThrough = require('stream').PassThrough;

const GithubModule = require('../../../lib/github/github');
const Github = GithubModule.Github;
const GithubResponseError = GithubModule.GithubResponseError;

suite('github/github', () => {

  suite('tokenFromFile()', () => {
    test.skip('returns a token from file if that file exists', () => {
      // not currently in use, add tests if put back into use
    });
    test.skip('returns null if token file cannot be read', () => {
      // not currently in use, add tests if put back into use
    });
  });

  suite('extractReleaseTarball()', () => {

    test('extracts a tarball from a github tarball url', () => {
      const tarballUrl = 'http://foo.com/bar.tar';
      let requestedUrl;
      const mockRequestApi = (options) => {
        requestedUrl = options.url;
        return fs.createReadStream(
        path.join(__dirname, 'github-test-data/test_tarball.tgz'));
      };
      const github = new Github({
        owner: 'TEST_OWNER',
        repo: 'TEST_REPO',
        requestApi: mockRequestApi,
      });
      const tmpDir = temp.mkdirSync();
      return github.extractReleaseTarball(tarballUrl, tmpDir).then(() => {
        assert.equal(requestedUrl, tarballUrl);
        assert.deepEqual(fs.readdirSync(tmpDir), ['file1.txt']);
      });
    });

    test('rejects when Github returns a 404 response status code', () => {
      const mockRequestApi = (options) => {
        const readStream = new PassThrough();
        setTimeout(() => {
          readStream.emit('response', {
          statusCode: 404,
          statusMessage: 'TEST MESSAGE - 404',
          });
        }, 10);
        return readStream;
      };
      const github = new Github({
        owner: 'TEST_OWNER',
        repo: 'TEST_REPO',
        requestApi: mockRequestApi,
      });
      const tmpDir = temp.mkdirSync();
      return github.extractReleaseTarball('http://foo.com/bar.tar', tmpDir)
        .then(() => {
          throw new Error('GithubResponseError expected');
        }).catch((err) => {
          assert.instanceOf(err, GithubResponseError);
          assert.equal(err.message, 'unexpected response: 404 TEST MESSAGE - 404');
        });
    });

  });

  suite('getSemverRelease()', () => {

    let getReleasesStub;
    let github;

    const basicReleasesResponse = [
      {tag_name: 'v1.0.0'},
      {tag_name: 'v1.1.0'},
      {tag_name: 'v1.2.1'},
      {tag_name: 'v2.0.0'},
      {tag_name: 'v2.0.0-pre.1'},
      {tag_name: 'v2.0.1'},
      {tag_name: 'v2.1.0'},
      {tag_name: 'TAG_NAME_WITHOUT_VERSION'},
    ];

    setup(() => {
      getReleasesStub = sinon.stub();
      github = new Github({
        owner: 'TEST_OWNER',
        repo: 'TEST_REPO',
        githubApi: {
          repos: {
            getReleases: getReleasesStub,
          },
        },
      });
    });

    test('calls the github API with correct params', () => {
      getReleasesStub.returns(Promise.resolve(basicReleasesResponse));

      return github.getSemverRelease('*')
        .then(() => {
          assert.isOk(getReleasesStub.calledWithExactly({
            owner: 'TEST_OWNER',
            repo: 'TEST_REPO',
            per_page: 100,
          }));
        });
    });

    test('resolves with latest semver release that matches the range: *', () => {
      getReleasesStub.returns(Promise.resolve(basicReleasesResponse));

      return github.getSemverRelease('*')
        .then((release) => {
          assert.deepEqual(release, {tag_name: 'v2.1.0'});
        });
    });

    test('resolves with latest semver release that matches the range: ^v1.0.0', () => {
      getReleasesStub.returns(Promise.resolve(basicReleasesResponse));

      return github.getSemverRelease('^v1.0.0')
        .then((release) => {
          assert.deepEqual(release, {tag_name: 'v1.2.1'});
        });
    });

    test('resolves with latest semver release that matches the range: ^v2.0.0', () => {
      getReleasesStub.returns(Promise.resolve(basicReleasesResponse));

      return github.getSemverRelease('^v2.0.0')
        .then((release) => {
          assert.deepEqual(release, {tag_name: 'v2.1.0'});
        });
    });

    test('rejects with an error if no matching releases are found', () => {
      getReleasesStub.returns(Promise.resolve(basicReleasesResponse));

      return github.getSemverRelease('^v3.0.0')
        .then(() => {
          throw new Error('Error expected');
        }).catch((err) => {
          assert.equal(err.message, 'TEST_OWNER/TEST_REPO has no releases matching ^v3.0.0.');
        });
    });
  });

});
