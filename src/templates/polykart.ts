/*
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import * as fs from 'fs';
import * as GitHubApi from 'github';
import * as http from 'http';
import {Base} from 'yeoman-generator';
import * as path from 'path';
import {Stream} from 'stream';

const gunzip = require('gunzip-maybe');
const request = require('request');
const tar = require('tar-fs');

export const PolykartGenerator = getGenerator();

export function getGenerator(options?) {
  let realGitHubApi = new GitHubApi({
    version: '3.0.0',
    protocol: 'https',
  });
  let requestApi = options && options.requestApi || request;
  let githubApi = options && options.githubApi || realGitHubApi;
  let githubToken = options && options.githubToken;
  // let outDir = options && options.outDir || process.cwd();

  return class PolykartGenerator extends Base {

    _github: GitHubApi;
    _githubToken: string;

    constructor(args: string | string[], options: any) {
      super(args, options);
      this._githubToken = this._getGitHubToken();
      this._github = githubApi;
      this._github.authenticate({
        type: 'oauth',
        token: this._githubToken,
      });
    }

    writing() {
      let done = this.async();
      console.log('Finding latest release of polykart...');
      return this._getTemplate()
        .then((release) => {
          let tarballUrl = release.tarball_url;
          console.log('Latest release URL:', tarballUrl);
          requestApi({
            url: tarballUrl,
            headers: {
              'User-Agent': 'request',
              'Authorization': `token ${this._githubToken}`,
            }
          })
          .on('response', (response) => {
            if (response.statusCode == 200) {
              console.log('Downloading template');
            }
          })
          .on('end', () => {
            console.log('complete');
            done();
          })
          .pipe(gunzip())
          .pipe(tar.extract(this.destinationRoot(), {
            ignore: (_, header) => {
              let splitPath = header.name.split(path.sep);
              // ignore the top directory in the tarfile to unpack directly to
              // the cwd
              return splitPath.length < 2 || splitPath[1] === '';
            },
            map: (header) => {
              let unprefixed = header.name.split(path.sep).slice(1).join(path.sep).trim();
              // the ./ is needed to unpack top-level files in the tar, otherwise
              // they're just not written
              header.name = './' + unprefixed;
              return header;
            }
          }));
        })
        .catch((error) => {
          console.error('Could not load polykart template');
          console.error(error);
          done();
        });
    }

    install() {
      (<any>this).bowerInstall();
    }

    _getGitHubToken() {
      if (githubToken) {
        return githubToken;
      }
      try {
        return fs.readFileSync('token', 'utf8').trim();
      } catch (e) {
        console.error(`
  You need to create a github token and place it in a file named 'token'.
  The token only needs the 'public repos' permission.
  Generate a token here: https://github.com/settings/tokens
  This restriction will be removed soon!
  `);
      }
    }

    _getTemplate(): Promise<GitHubApi.Release> {
      return new Promise((resolve, reject) => {
        this._github.releases.listReleases({
          owner: 'PolymerLabs',
          repo: 'polykart',
        }, (err, result) => {
          if (err) {
            reject(err);
          } else {
            if (result.length === 0) {
              reject('no releases');
            } else {
              resolve(result[0]);
            }
          }
        });
      });
    }
  }
}
