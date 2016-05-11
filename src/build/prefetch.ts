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
import {Transform} from 'stream';
import File = require('vinyl');

import {StreamAnalyzer, DepsIndex} from './analyzer';

export class PrefetchTransform extends Transform {
  root: string;
  main: string;
  shell: string;
  entrypoints: string[];
  allEntrypoints: string[];
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
    main: string,

    /**
     * The app shell. This will have link rel=imports added to it.
     */
    shell: string,

    /**
     * List of files that will have dependencies flattened with
     * `<link rel="import">`
     */
    entrypoints: string[],

    /**
     * The analyzer to retreive dependency information from.
     */
    analyzer: StreamAnalyzer
  ) {
    super({objectMode: true});
    this.root = root;
    this.main = main;
    this.shell = shell;
    this.entrypoints = entrypoints;
    this.allEntrypoints = entrypoints;
    if (shell) {
      this.allEntrypoints = this.allEntrypoints.concat(shell);
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
      dep = path.relative(file.dirname, dep);
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

  _transform(file: File, enc: string, callback: (err?, file?) => void) {
    if (this.isImportantFile(file)) {
      // hold on to the file for safe keeping
      this.fileMap.set(file.path, file);
      callback(null, null);
    } else {
      callback(null, file);
    }
  }

  isImportantFile(file) {
    return file.path == this.main ||
        this.allEntrypoints.indexOf(file.path) > -1;
  }

  _flush(done: (err?) => void) {
    if (this.fileMap.size === 0) {
      return done();
    }
    this.analyzer.analyze.then((depsIndex: DepsIndex) => {
      let entrypointToDeps = new Map(depsIndex.entrypointToDeps);

      if (this.main && this.shell) {
        let file = this.fileMap.get(this.main);
        // forward shell's dependencies to main to be prefetched
        let deps = entrypointToDeps.get(this.shell);
        if (deps) {
          this.pullUpDeps(file, deps, 'prefetch');
        }
        this.push(file);
        this.fileMap.delete(this.main);
      }

      for (let im of this.allEntrypoints) {
        let file = this.fileMap.get(im);
        let deps = entrypointToDeps.get(im);
        if (deps) {
          this.pullUpDeps(file, deps, 'import');
        }
        this.push(file);
        this.fileMap.delete(im);
      }

      for (let leftover of this.fileMap.keys()) {
        console.log(
          'Warning: File was listed in entrypoints but not found in stream:',
          leftover
        );
        this.push(this.fileMap.get(leftover));
        this.fileMap.delete(leftover);
      }

      done();
    });
  }
}
