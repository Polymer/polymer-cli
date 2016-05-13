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
import * as path from 'path';

export interface ProjectConfigOptions {
  root?: string;
  entrypoint?: string;
  shell?: string;
  fragment?: string[];
  fragments?: string[];
}

export class ProjectConfig {
  root: string;
  entrypoint: string;
  shell: string;
  fragments: string[];
  inputs: string[];

  static fromConfigFile(filepath: string): ProjectConfig {
    try {
      let configContent = fs.readFileSync(filepath, 'utf-8');
      return JSON.parse(configContent);
    } catch(error) {
      // don't log if error is just "file not found"
      if (error.code !== 'ENOENT') {
        console.log('Could not load config file');
        console.error(error);
      }
    }
  }

  constructor(configFile?: string, options?: ProjectConfigOptions) {
    this._init(configFile, options);
  }

  _init(configFile?: string, options?: ProjectConfigOptions) {
    options = options || {};
    if (configFile) {
      // config file is default, options will override
      let fromFile = ProjectConfig.fromConfigFile(configFile);
      if (fromFile) {
        Object.assign(fromFile, options);
        options = fromFile;
      }
    }
    this.root = options.root || process.cwd();
    if (options.entrypoint) {
      this.entrypoint = path.resolve(this.root, options.entrypoint);
    } else {
      try {
        let bowerConfigContent =
          fs.readFileSync(path.resolve(this.root, 'bower.json'), 'utf-8');
        let bowerConfig = JSON.parse(bowerConfigContent);
        if (bowerConfig.main && typeof bowerConfig.main === 'string') {
          this.entrypoint = path.resolve(this.root, bowerConfig.main);
        }
      } catch(_) {
        this.entrypoint = path.resolve(this.root, 'index.html');
      }
    }
    if (options.shell) {
      this.shell = path.resolve(this.root, options.shell);
    }
    this.fragments = [];
    // fragment comes from command-line-args `--fragment`
    let frag = options.fragment || options.fragments;
    if (frag) {
      this.fragments = frag.map((e) => path.resolve(this.root, e));
    }

    this.inputs = [];
    if (this.entrypoint) this.inputs.push(this.entrypoint);
    if (this.shell) this.inputs.push(this.shell);
    this.inputs = this.inputs.concat(this.fragments);
  }
}
