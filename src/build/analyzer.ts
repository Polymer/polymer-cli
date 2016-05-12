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
import {Analyzer, Deferred, Loader, Resolver} from 'hydrolysis';
import * as path from 'path';
import {Transform} from 'stream';
import File = require('vinyl');
import {parse as parseUrl} from 'url';

const minimatchAll = require('minimatch-all');

export class StreamAnalyzer extends Transform {

  root: string;
  shell: string;
  entrypoints: string[];
  allEntrypoints: string[];

  resolver: StreamResolver;
  loader: Loader;
  analyzer: Analyzer;

  files = new Map<string, File>();

  _analyzeResolve: (DepsIndex) => void;
  analyze: Promise<DepsIndex>;

  constructor(root: string, shell: string, entrypoints?: string[]) {
    super({objectMode: true});
    this.root = root;
    this.shell = shell;
    this.entrypoints = entrypoints;

    this.allEntrypoints = [];
    // It's important that shell is first for document-ordering of imports
    if (shell) {
      this.allEntrypoints.push(shell);
    }
    if (entrypoints) {
      this.allEntrypoints = this.allEntrypoints.concat(entrypoints);
    }

    this.resolver = new StreamResolver(this);
    this.loader = new Loader();
    this.loader.addResolver(this.resolver);
    this.analyzer = new Analyzer(false, this.loader);
    this.analyze = new Promise((resolve, reject) => {
      this._analyzeResolve = resolve;
    });
  }

  _transform(
      file: File,
      encoding: string,
      callback: (error?, data?: File) => void
    ) : void {

    // store the file for access by the resolver
    this.files.set(file.path, file);

    // If this is the entrypoint, hold on to the file, so that it's fully
    // analyzed by the time down-stream transforms see it.
    if (this.isEntrypoint(file)) {
      callback(null, null);
    } else {
      callback(null, file);
    }

  }

  _flush(done: (error?) => void) {
    this._getDepsToEntrypointIndex().then((depsIndex) => {
      // push held back files
      for (let entrypoint of this.allEntrypoints) {
        let file = this.files.get(entrypoint);
        this.push(file);
      }
      this._analyzeResolve(depsIndex);
      done();
    });
  }

  /**
   * A side-channel to add files to the resolver that did not come throgh the
   * stream transformation. This is for generated files, like
   * shared-bundle.html. This should probably be refactored so that the files
   * can be injected into the stream.
   */
  addFile(file) {
    this.files.set(file.path, file);
  }

  isEntrypoint(file): boolean {
    return this.allEntrypoints.indexOf(file.path) !== -1;
  }

  _getDepsToEntrypointIndex(): Promise<DepsIndex> {
    // TODO: tsc is being really weird here...
    let depsPromises = <Promise<string[]>[]>this.allEntrypoints.map(
        (e) => this._getDependencies(e));

    return Promise.all(depsPromises).then((value: any) => {
      console.log('analyzer._getDepsToEntrypointIndex B');
      // tsc was giving a spurious error with `allDeps` as the parameter
      let allDeps: string[][] = <string[][]>value;

      // An index of dependency -> entrypoints that depend on it
      let depsToEntrypoints = new Map<string, string[]>();

      // An index of entrypoints -> dependencies
      let entrypointToDeps = new Map<string, string[]>();

      console.assert(this.allEntrypoints.length === allDeps.length);

      for (let i = 0; i < allDeps.length; i++) {
        let entrypoint = this.allEntrypoints[i];
        let deps: string[] = allDeps[i];
        console.assert(deps != null, `deps is null for ${entrypoint}`);

        entrypointToDeps.set(entrypoint, deps);

        for (let dep of deps) {
          let entrypointList;
          if (!depsToEntrypoints.has(dep)) {
            entrypointList = [];
            depsToEntrypoints.set(dep, entrypointList);
          } else {
            entrypointList = depsToEntrypoints.get(dep);
          }
          entrypointList.push(entrypoint);
        }
      }
      return {
        depsToEntrypoints,
        entrypointToDeps,
      };
    });
  }

  /**
   * Attempts to retreive document-order transitive dependencies for `url`.
   */
  _getDependencies(url: string): Promise<string[]> {
    let visited = new Set();
    let list = [];
    // async depth-first traversal: waits for document load, then async
    // iterates on dependencies. No return values are used, writes to visited
    // and list.
    //
    // document.depHrefs is _probably_ document order, if all html imports are
    // at the same level in the tree.
    // See: https://github.com/Polymer/hydrolysis/issues/240
    let _getDeps = (url: string) =>
        this.analyzer.load(url).then((d) => _iterate(d.depHrefs.values()));

    // async iteration: waits for _getDeps on a value to return before
    // recursing to call _getDeps on the next value.
    let _iterate = (iterator: Iterator<string>) => {
      let next = iterator.next();
      if (next.done || visited.has(next.value)) {
        return Promise.resolve();
      } else {
        list.push(next.value);
        visited.add(url);
        return _getDeps(next.value).then((_) => _iterate(iterator));
      }
    }
    // kick off the traversal from root, then resolve the list of dependencies
    return _getDeps(url).then((_) => list);
  }
}

export interface DepsIndex {
  depsToEntrypoints: Map<string, string[]>;
  entrypointToDeps: Map<string, string[]>;
}

class StreamResolver implements Resolver {
  analyzer: StreamAnalyzer;

  constructor(analyzer: StreamAnalyzer) {
    this.analyzer = analyzer;
  }

  accept(url: string, deferred: Deferred<string>): boolean {
    var parsed = parseUrl(url);
    var filepath: string;

    if (!parsed.hostname) {
      filepath = parsed.pathname;
    }

    // this.analyzer.requestedUrls.add(local);

    if (filepath) {
      // un-escape HTML escapes
      filepath = decodeURIComponent(filepath);

      // If the file path is not already under root, such as /bower_components/...,
      // prefix it with root
      if (!filepath.startsWith(this.analyzer.root)) {
        filepath = path.join(this.analyzer.root, filepath);
      }

      let file = this.analyzer.files.get(filepath);
      if (file) {
        deferred.resolve(file.contents.toString());
      } else {
        console.log('No file found for', filepath);
      }
      return true;
    }
    return false;
  }
}
