/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import * as fs from 'fs';
import * as GitHubApi from 'github';
import * as path from 'path';

const gunzip = require('gunzip-maybe');
const request = require('request');
const tar = require('tar-fs');

export class Github {
  private _token: string;
  private _github: GitHubApi;
  private _request;
  private _owner: string;
  private _repo: string;

  static tokenFromFile(filename: string): string {
    return fs.readFileSync(filename, 'utf8').trim();
  }

  constructor(
    owner: string,
    repo: string,
    token: string,
    githubApi?,
    requestApi?
  ) {
    this._token = token;
    this._owner = owner;
    this._repo = repo;
    this._github = githubApi || new GitHubApi({
      version: '3.0.0',
      protocol: 'https'
    });
    this._github.authenticate({
      type: 'oauth',
      token
    });
    this._request = requestApi || request;
  }

  extractLatestRelease(outDir: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let tarPipe = tar.extract(outDir, {
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
        },
      });
      this.getLatestRelease().then((release) => {
        let tarballUrl = release.tarball_url;
        this._request({
          url: tarballUrl,
          headers: {
            'User-Agent': 'request',
            'Authorization': `token ${this._token}`
          }
        })
        .on('end', () => {
          resolve();
        })
        .pipe(gunzip())
        .pipe(tarPipe)
        .on('error', (error) => {
          throw error;
        })
      })
      .catch((error) => {
        reject(error);
      });
    });
  }

  getLatestRelease(): Promise<GitHubApi.Release> {
    return new Promise((resolve, reject) => {
      this._github.releases.listReleases({
        owner: this._owner,
        repo: this._repo
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
