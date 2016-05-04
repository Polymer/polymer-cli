/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import * as gulpif from 'gulp-if';
import {Transform} from 'stream';

import {Logger} from './logger';
import {compose} from './streams';
import {StreamResolver} from './stream-resolver';
import {VulcanizeTransform} from './vulcanize';

// non-ES module
const minimatchAll = require('minimatch-all');

export class Bundler {

  root: string;
  shell: string;
  allEntrypoints: string[];

  streamResolver: StreamResolver;
  bundle: Transform;
  vulcanize: Transform;

  constructor(root: string, shell: string, entrypoints: string[]) {
    this.root = root;
    this.shell = shell;
    let allEntrypoints = [];
    if (shell) allEntrypoints.push(shell);
    this.allEntrypoints =
        Array.prototype.concat.apply(allEntrypoints, entrypoints);

    console.log('allEntrypoints', this.allEntrypoints);

    this.streamResolver = new StreamResolver({
        entrypoints: this.allEntrypoints,
        basePath: root,
        root: root,
        redirect: 'bower_components/',
      });
    this.vulcanize = new VulcanizeTransform({
      fsResolver: this.streamResolver,
      inlineScripts: true,
      inlineCss: true,
      stripComments: true,
    });

    this.bundle = compose([
      this.streamResolver,
      gulpif((file) => this.isEntryPoint(file.path),
        compose([
          new Logger('pre-vulcanize'),
          this.vulcanize,
          new Logger('post-vulcanize'),
        ])
      )
    ]);
  }

  isEntryPoint(filepath: string): boolean {
    return minimatchAll(filepath, this.allEntrypoints, {matchBase: true})
  }

}
