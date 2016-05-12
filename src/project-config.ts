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
  main?: string;
  shell?: string;
  entrypoints?: string[];
}

export class ProjectConfig {
  root: string;
  main: string;
  shell: string;
  entrypoints: string[];

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
    this.init(configFile, options);
  }

  init(configFile?: string, options?: ProjectConfigOptions) {
    options = options || {};
    if (configFile) {
      // config file is default, options will override
      let fromFile = ProjectConfig.fromConfigFile(configFile);
      if (fromFile) {
        for (let option in options) {
          fromFile[option] = options[option];
        }
        options = fromFile;
      }
    }
    this.root = options.root || process.cwd();
    if (options.main) {
      this.main = path.resolve(this.root, options.main);
    } else {
      try {
        let bowerConfigContent =
          fs.readFileSync(path.resolve(this.root, 'bower.json'), 'utf-8');
        let bowerConfig = JSON.parse(bowerConfigContent);
        if (bowerConfig.main && typeof bowerConfig.main === 'string') {
          this.main = path.resolve(this.root, bowerConfig.main);
        }
      } catch(_) {
        this.main = path.resolve(this.root, 'index.html');
      }
    }
    if (options.shell) {
      this.shell = path.resolve(this.root, options.shell);
    }
    this.entrypoints = [];
    if (options.entrypoints) {
      this.entrypoints = options.entrypoints.map(
        (e) => path.resolve(this.root, e)
      );
    }
  }
}
