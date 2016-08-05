/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import * as dom5 from 'dom5';
import * as path from 'path';
import * as logging from 'plylog';
import {Transform} from 'stream';
import File = require('vinyl');
import {StreamAnalyzer, DepsIndex} from 'polymer-build';

let logger = logging.getLogger('cli.build.prefech');

export class PrefetchTransform extends Transform {
  root: string;
  entrypoint: string;
  shell: string;
  fragments: string[];
  allFragments: string[];
  fileMap: Map<string, File>;
  analyzer: StreamAnalyzer;

  constructor(
    /**
     * Root of the dependencies.
     * Will be stripped when making links
     */
    root: string,

    /**
     * The main HTML file. This will have link rel=prefetches added to it.
     */
    entrypoint: string,

    /**
     * The app shell. This will have link rel=imports added to it.
     */
    shell: string,

    /**
     * List of files that will have dependencies flattened with
     * `<link rel="import">`
     */
    fragments: string[],

    /**
     * The analyzer to retreive dependency information from.
     */
    analyzer: StreamAnalyzer
  ) {
    super({objectMode: true});
    this.root = root;
    this.entrypoint = entrypoint;
    this.shell = shell;
    this.fragments = fragments;
    // clone fragments
    this.allFragments = Array.from(fragments);
    if (shell) {
      this.allFragments.push(shell);
    } else {
      this.allFragments.push(entrypoint);
    }
    this.analyzer = analyzer;
    this.fileMap = new Map<string, File>();
  }

  pullUpDeps(
    file: File,
    deps: string[],
    type: 'import' | 'prefetch'
  ) {
    let contents = file.contents.toString();
    let ast = dom5.parse(contents);
    let head = dom5.query(ast, dom5.predicates.hasTagName('head'));
    for (let dep of deps) {
      if (dep.startsWith(this.root)) {
        dep = path.relative(file.dirname, dep);
      }
      // prefetched deps should be absolute, as they will be in the main file
      if (type === 'prefetch') {
        dep = path.join('/', dep);
      }
      let link = dom5.constructors.element('link');
      dom5.setAttribute(link, 'rel', type);
      dom5.setAttribute(link, 'href', dep);
      dom5.append(head, link);
    }
    contents = dom5.serialize(ast);
    file.contents = new Buffer(contents);
  }

  _transform(file: File, enc: string, callback: (error?, file?) => void) {
    if (this.isImportantFile(file)) {
      // hold on to the file for safe keeping
      this.fileMap.set(file.path, file);
      callback(null, null);
    } else {
      callback(null, file);
    }
  }

  isImportantFile(file) {
    return file.path === this.entrypoint ||
        this.allFragments.indexOf(file.path) > -1;
  }

  _flush(done: (error?) => void) {
    if (this.fileMap.size === 0) {
      return done();
    }
    this.analyzer.analyzeDependencies.then((depsIndex: DepsIndex) => {
      let fragmentToDeps = new Map(depsIndex.fragmentToDeps);

      if (this.entrypoint && this.shell) {
        let file = this.fileMap.get(this.entrypoint);
        // forward shell's dependencies to main to be prefetched
        let deps = fragmentToDeps.get(this.shell);
        if (deps) {
          this.pullUpDeps(file, deps, 'prefetch');
        }
        this.push(file);
        this.fileMap.delete(this.entrypoint);
      }

      for (let im of this.allFragments) {
        let file = this.fileMap.get(im);
        let deps = fragmentToDeps.get(im);
        if (deps) {
          this.pullUpDeps(file, deps, 'import');
        }
        this.push(file);
        this.fileMap.delete(im);
      }

      for (let leftover of this.fileMap.keys()) {
        logger.warn(
          'File was listed in fragments but not found in stream:',
          leftover
        );
        this.push(this.fileMap.get(leftover));
        this.fileMap.delete(leftover);
      }

      done();
    });
  }
}
