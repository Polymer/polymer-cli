/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import * as fs from 'fs';
import * as path from 'path';
import * as logging from 'plylog';

import request = require('request');
import GitHubApi = require('github');

const gunzip = require('gunzip-maybe');
const tar = require('tar-fs');

const logger = logging.getLogger('cli.github');

export type RequestAPI = request.RequestAPI<
    request.Request,
    request.CoreOptions,
    request.RequiredUriUrl>;

class GithubResponseError extends Error {
  name = 'GithubResponseError';
  statusCode?: number;
  statusMessage?: string;

  constructor(statusCode?: number, statusMessage?: string) {
    super('unexpected response: ' + statusCode + ' ' + statusMessage);
    this.statusCode = statusCode;
    this.statusMessage = statusMessage;
  }
}

export interface GithubOpts {
  owner: string;
  repo: string;
  githubToken?: string;
  githubApi?: GitHubApi;
  requestApi?: request
      .RequestAPI<request.Request, request.CoreOptions, request.RequiredUriUrl>;
}

export class Github {
  private _token: string|null;
  private _github: GitHubApi;
  private _request: request
      .RequestAPI<request.Request, request.CoreOptions, request.RequiredUriUrl>;
  private _owner: string;
  private _repo: string;

  static tokenFromFile(filename: string): string|null {
    try {
      return fs.readFileSync(filename, 'utf8').trim();
    } catch (error) {
      return null;
    }
  }

  constructor(opts: GithubOpts) {
    this._token = opts.githubToken || Github.tokenFromFile('token');
    this._owner = opts.owner;
    this._repo = opts.repo;
    this._github = opts.githubApi || new GitHubApi({
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

  async extractLatestRelease(outDir: string): Promise<void> {
    const tarPipe = tar.extract(outDir, {
      ignore: (_: any, header: any) => {
        let splitPath = path.normalize(header.name).split(path.sep);
        // ignore the top directory in the tarfile to unpack directly to
        // the cwd
        return splitPath.length < 1 || splitPath[1] === '';
      },
      map: (header: any) => {
        let splitPath = path.normalize(header.name).split(path.sep);
        let unprefixed = splitPath.slice(1).join(path.sep).trim();
        // A ./ prefix is needed to unpack top-level files in the tar,
        // otherwise they're just not written
        header.name = path.join('.', unprefixed);
        return header;
      },
    });
    const release = await this.getLatestRelease();
    const tarballUrl = release.tarball_url;
    return new Promise<void>((resolve, reject) => {
      this._request({
            url: tarballUrl,
            headers: {
              'User-Agent': 'request',
              'Authorization': (this._token) ? `token ${this._token}` :
                                                undefined,
            }
          })
          .on('response',
              function(response) {
                if (response.statusCode !== 200) {
                  throw new GithubResponseError(
                      response.statusCode, response.statusMessage);
                }
                logger.info('Unpacking template files');
              })
          .pipe(gunzip())
          .pipe(tarPipe)
          // tar-fs/tar-stream do not send 'end' events, only 'finish'
          // events
          .on('finish',
              () => {
                logger.info('Finished writing template files');
                resolve();
              })
          .on('error', (error: any) => {
            reject(error);
          });
    });
  }

  async getLatestRelease(): Promise<GitHubApi.Release> {
    const releases = await this._github.repos.getReleases({
            owner: this._owner,
            repo: this._repo,
            per_page: 1,
    }) as GitHubApi.Release[];
    if (releases.length === 0) {
      throw new Error(
        `${this._owner}/${this._repo} has 0 releases. ` +
        'Cannot get latest release.');
    }
    return releases[0];
  }
}
