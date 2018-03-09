/*
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {assert} from 'chai';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as sinon from 'sinon';
import {PassThrough} from 'stream';
import * as tempMod from 'temp';

import {Github, GithubResponseError} from '../../../github/github';
import {invertPromise} from '../../util';

const temp = tempMod.track();

suite('github/github', () => {

  suite('tokenFromFile()', () => {
    test.skip(
        'returns a token from file if that file exists',
        () => {
            // not currently in use, add tests if put back into use
        });
    test.skip(
        'returns null if token file cannot be read',
        () => {
            // not currently in use, add tests if put back into use
        });
  });

  suite('extractReleaseTarball()', () => {

    test('extracts a tarball from a github tarball url', async () => {
      const tarballUrl = 'http://foo.com/bar.tar';
      let requestedUrl;
      const mockRequestApi = (options: any) => {
        requestedUrl = options.url;
        return fs.createReadStream(
            path.join(__dirname, 'github-test-data/test_tarball.tgz'));
      };
      const github = new Github({
        owner: 'TEST_OWNER',
        repo: 'TEST_REPO',
        requestApi: mockRequestApi as any,
      });
      const tmpDir = temp.mkdirSync();
      await github.extractReleaseTarball(tarballUrl, tmpDir);
      assert.equal(requestedUrl, tarballUrl);
      assert.deepEqual(fs.readdirSync(tmpDir), ['file1.txt']);
    });

    test('rejects when Github returns a 404 response status code', async () => {
      const mockRequestApi = (_options: any) => {
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
        requestApi: mockRequestApi as any,
      });
      const tmpDir = temp.mkdirSync();
      const err = await invertPromise(
          github.extractReleaseTarball('http://foo.com/bar.tar', tmpDir));
      assert.instanceOf(err, GithubResponseError);
      assert.equal(err.message, 'unexpected response: 404 TEST MESSAGE - 404');

    });

  });

  suite('removeUnwantedFiles()', () => {

    function makeDirStruct(files: string[]) {
      const tmpDir = temp.mkdirSync();
      files.forEach((file) => {
        const nodes = file.split('/');
        let tmpPath = tmpDir;
        nodes.forEach((node, index) => {
          tmpPath = path.join(tmpPath, node);
          if (fs.existsSync(tmpPath)) {
            return;
          }
          if (index === nodes.length - 1) {
            fs.writeFileSync(tmpPath, '');
          } else {
            fs.mkdirSync(tmpPath);
          }
        });
      });
      return tmpDir;
    }

    test('removes correct files', () => {
      const tmpDir = makeDirStruct([
        '.gitattributes',
        '.github/CONTRIBUTING',
        '.gitignore',
        '.travis.yml',
        'README',
        'src/base.js',
      ]);
      const github = new Github({
        owner: 'TEST_OWNER',
        repo: 'TEST_REPO',
      });
      github.removeUnwantedFiles(tmpDir);
      assert.deepEqual(fs.readdirSync(tmpDir), ['.gitignore', 'README', 'src']);
      assert.deepEqual(fs.readdirSync(path.join(tmpDir, 'src')), ['base.js']);
    });

  });

  suite('getSemverRelease()', () => {

    let getReleasesStub: sinon.SinonStub;
    let github: Github;

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
      } as any);
    });

    test('calls the github API with correct params', async () => {
      getReleasesStub.returns(Promise.resolve(basicReleasesResponse));

      await github.getSemverRelease('*');
      assert.isOk(getReleasesStub.calledWithExactly({
        owner: 'TEST_OWNER',
        repo: 'TEST_REPO',
        per_page: 100,
      }));
    });

    let testName =
        'resolves with latest semver release that matches the range: *';
    test(testName, async () => {
      getReleasesStub.returns(Promise.resolve(basicReleasesResponse));

      const release = await github.getSemverRelease('*');
      assert.deepEqual(release, {tag_name: 'v2.1.0'});
    });

    testName =
        'resolves with latest semver release that matches the range: ^v1.0.0';
    test(testName, async () => {
      getReleasesStub.returns(Promise.resolve(basicReleasesResponse));

      const release = await github.getSemverRelease('^v1.0.0');
      assert.deepEqual(release, {tag_name: 'v1.2.1'});
    });

    testName =
        'resolves with latest semver release that matches the range: ^v2.0.0';
    test(testName, async () => {
      getReleasesStub.returns(Promise.resolve(basicReleasesResponse));

      const release = await github.getSemverRelease('^v2.0.0');
      assert.deepEqual(release, {tag_name: 'v2.1.0'});
    });

    testName = 'rejects with an error if no matching releases are found';
    test(testName, async () => {
      getReleasesStub.returns(Promise.resolve(basicReleasesResponse));

      const err = await invertPromise(github.getSemverRelease('^v3.0.0'));
      assert.equal(
          err.message,
          'TEST_OWNER/TEST_REPO has no releases matching ^v3.0.0.');
    });
  });

});
