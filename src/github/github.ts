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
import * as logging from 'plylog';
import * as path from 'path';

const gunzip = require('gunzip-maybe');
const request = require('request');
const tar = require('tar-fs');

let logger = logging.getLogger('cli.github');

class GithubResponseError extends Error {
  name = 'GithubResponseError';
  statusCode: number;
  statusMessage: string;

  constructor(statusCode: number, statusMessage: string) {
    super('unexpected response: ' + statusCode + ' ' + statusMessage);
    this.statusCode = statusCode;
    this.statusMessage = statusMessage;
  }

}

export interface GithubOpts {
  owner: string;
  repo: string;
  githubToken?: string;
  githubApi?;
  requestApi?;
}

export class Github {
  private _token: string;
  private _github: GitHubApi;
  private _request;
  private _owner: string;
  private _repo: string;

  static tokenFromFile(filename: string): string {
    try {
      return fs.readFileSync(filename, 'utf8').trim();
    } catch (e) {
      return null;
    }
  }

  constructor(opts: GithubOpts) {
    this._token = opts.githubToken || Github.tokenFromFile('token');
    this._owner = opts.owner;
    this._repo = opts.repo;
    this._github = opts.githubApi || new GitHubApi({
      version: '3.0.0',
      protocol: 'https',
    });
    if (this._token != null) {
      this._github.authenticate({
        type: 'oauth',
        token: this._token,
      });
    }
    this._request = opts.requestApi || request;
  }

  extractLatestRelease(outDir: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let tarPipe = tar.extract(outDir, {
        ignore: (_, header) => {
          //fix path
          header.name = path.join('', header.name);
          let splitPath = header.name.split(path.sep);
          // ignore the top directory in the tarfile to unpack directly to
          // the cwd
          // ignore only directory
          return (splitPath.length < 2 || splitPath[1] === '') && header.type == 'folder';
        },
        map: (header) => {
          //fix path
          header.name = path.join('', header.name);
          let unprefixed =
              header.name.split(path.sep).slice(1).join(path.sep).trim();
          // the ./ is needed to unpack top-level files in the tar, otherwise
          // they're just not written
          //fix path
          header.name = path.join('./', unprefixed);
          return header;
        },
      });
      this.getLatestRelease().then((release) => {
        let tarballUrl = release.tarball_url;
        this._request({
          url: tarballUrl,
          headers: {
            'User-Agent': 'request',
            'Authorization': (this._token) ? `token ${this._token}` : undefined,
          }
        })
        .on('response', function(response) {
          if (response.statusCode !== 200) {
            let err = new GithubResponseError(
                response.statusCode,
                response.statusMessage);
            throw err;
          }
          logger.info('Unpacking template files');
        })
        .pipe(gunzip())
        .pipe(tarPipe)
        // tar-fs/tar-stream do not send 'end' events, only 'finish' events
        .on('finish', () => {
          logger.info('Finished writing template files');
          resolve();
        })
        .on('error', (error) => {
          throw error;
        });
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
