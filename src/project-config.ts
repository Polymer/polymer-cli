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
import * as logging from 'plylog';

const logger = logging.getLogger('cli.project-config');

export const defaultSourceGlobs = [
  'src/**/*',
  // NOTE(fks) 06-29-2016: `polymer-cli serve` uses a bower.json file to display
  // information about the project. The file is included here by default.
  'bower.json',
];

export interface ProjectConfigOptions {
  root?: string;
  entrypoint?: string;
  shell?: string;
  fragment?: string[];
  fragments?: string[];

  // The options below were forked by polymer-build. We need to support all
  // polymer-cli, polymer-build, and CLI flag formats until this is addressed.
  sources?: string[];
  sourceGlobs?: string[];
  'include-dependencies'?: string[];
  includeDependencies?: string[];
}

export class ProjectConfig {
  root: string;
  entrypoint: string;
  shell: string;
  fragments: string[];
  inputs: string[];
  sourceGlobs: string[];
  includeDependencies: string[];

  static fromConfigFile(filepath: string): ProjectConfigOptions {
    try {
      let configContent = fs.readFileSync(filepath, 'utf-8');
      return JSON.parse(configContent);
    } catch (error) {
      // swallow "not found" errors because they are so common / expected
      if (error.code === 'ENOENT') {
        logger.debug('no polymer config file found', {file: filepath});
        return;
      }
      // throw all other errors when a config exists but was not properly read
      logger.error('Failed to load/parse polymer config file', {
        file: filepath,
        err: error.message,
      });
      throw error;
    }
  }

  constructor(defaultOptions?: string | ProjectConfigOptions, overrideOptions?: ProjectConfigOptions) {
    if (typeof defaultOptions === 'string') {
      defaultOptions = ProjectConfig.fromConfigFile(<string>defaultOptions) || {};
    }
    this._init(defaultOptions, overrideOptions);
  }

  _init(defaultOptions?: ProjectConfigOptions, overrideOptions?: ProjectConfigOptions) {
    let options: ProjectConfigOptions = Object.assign({}, defaultOptions, overrideOptions);

    this.root = options.root || process.cwd();
    this.sourceGlobs = options.sources || options.sourceGlobs || defaultSourceGlobs;
    this.includeDependencies = options['include-dependencies'] || options.includeDependencies;

    if (options.entrypoint) {
      this.entrypoint = path.resolve(this.root, options.entrypoint);
    } else {
      // fallback
      this.entrypoint = path.resolve(this.root, 'index.html');
      try {
        let bowerConfigContent =
          fs.readFileSync(path.resolve(this.root, 'bower.json'), 'utf-8');
        let bowerConfig = JSON.parse(bowerConfigContent);
        if (bowerConfig.main && typeof bowerConfig.main === 'string') {
          this.entrypoint = path.resolve(this.root, bowerConfig.main);
        }
      } catch (error) {
        // do nothing
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
