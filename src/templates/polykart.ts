/*
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import * as fs from 'fs';
import {Github} from '../github/github';
import * as path from 'path';
import {Base} from 'yeoman-generator';

export const PolykartGenerator = getGenerator();

export function getGenerator(options?) {
  let requestApi = options && options.requestApi;
  let githubApi = options && options.githubApi;
  let githubToken = options && options.githubToken;
  // let outDir = options && options.outDir || process.cwd();

  return class PolykartGenerator extends Base {

    _github: Github;

    constructor(args: string | string[], options: any) {
      super(args, options);
      this._github = new Github({
        owner: 'PolymerLabs',
        repo: 'polykart',
        githubToken,
        githubApi,
        requestApi
      });
    }

    writing() {
      let done = this.async();
      console.log('Finding and extracting latest release of polykart...');
      return this._github.extractLatestRelease(this.destinationRoot())
        .then(() => {
          done();
        })
        .catch((error) => {
          console.error('Could not load polykart template');
          console.error(error);
          done();
        });
    }

    install() {
      this.installDependencies();
    }
  }
}
