/*
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

import * as logging from 'plylog';
import {Base} from 'yeoman-generator';

import {Github, RequestAPI} from '../github/github';

import GitHubApi = require('github');

const logger = logging.getLogger('cli.init');

export interface GithubGeneratorOptions {
  requestApi?: RequestAPI;
  githubApi?: GitHubApi;
  githubToken?: string;
  owner: string;
  repo: string;
}

export function createGithubGenerator(githubOptions: GithubGeneratorOptions):
    (typeof Base) {
  let requestApi = githubOptions.requestApi;
  let githubApi = githubOptions.githubApi;
  let githubToken = githubOptions.githubToken;
  let owner = githubOptions.owner;
  let repo = githubOptions.repo;

  return class GithubGenerator extends Base {
    _github: Github;

    constructor(args: string|string[], options: any) {
      super(args, options);
      this._github =
          new Github({owner, repo, githubToken, githubApi, requestApi});
    }

    rootGeneratorName(): string {
      return 'GithubGenerator';
    }

    async writing(): Promise<void> {
      const done = this.async();
      logger.info(`Downloading latest release of ${owner}/${repo}`);
      try {
        await this._github.extractLatestRelease(this.destinationRoot());
        done();
      } catch (error) {
        logger.error(`Could not download release from ${owner}/${repo}`);
        done(error);
      }
    }

    install() {
      this.installDependencies({
        npm: false,
      });
    }
  };
}
