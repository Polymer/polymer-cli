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
import Generator = require('yeoman-generator');

import {Github} from '../github/github';

const logger = logging.getLogger('cli.init');

export interface GithubGeneratorOptions {
  githubToken?: string;
  owner: string;
  repo: string;
  semverRange?: string;
}

export function createGithubGenerator(githubOptions: GithubGeneratorOptions):
    (typeof Generator) {
  const githubToken = githubOptions.githubToken;
  const owner = githubOptions.owner;
  const repo = githubOptions.repo;
  const semverRange = githubOptions.semverRange || '*';

  return class GithubGenerator extends Generator {
    _github: Github;

    constructor(args: string|string[], options: any) {
      super(args, options);
      this._github = new Github({owner, repo, githubToken});
    }

    // This is necessary to prevent an exception in Yeoman when creating
    // storage for generators registered as a stub and used in a folder
    // with a package.json but with no name property.
    // https://github.com/Polymer/polymer-cli/issues/186
    rootGeneratorName(): string {
      return 'GithubGenerator';
    }

    async writing(): Promise<void> {
      const done = this.async();
      let release;

      logger.info(
          (semverRange === '*') ?
              `Finding latest release of ${owner}/${repo}` :
              `Finding latest ${semverRange} release of ${owner}/${repo}`);
      try {
        release = await this._github.getSemverRelease(semverRange);
      } catch (error) {
        done(error);
        return;
      }

      logger.info(`Downloading ${release.tag_name} of ${owner}/${repo}`);
      try {
        await this._github.extractReleaseTarball(
            release.tarball_url, this.destinationRoot());
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
