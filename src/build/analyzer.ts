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
import {Analyzer, Deferred, Loader, Resolver, DocumentDescriptor} from 'hydrolysis';
import * as path from 'path';
import {Transform} from 'stream';
import File = require('vinyl');
import {parse as parseUrl} from 'url';
import * as logging from 'plylog';
import {Node, queryAll, predicates, getAttribute} from 'dom5';

const minimatchAll = require('minimatch-all');
let logger = logging.getLogger('cli.build.analyzer');

export interface DocumentDeps{
  imports?: Array<string>,
  scripts?: Array<string>,
  styles?: Array<string>
}

export class StreamAnalyzer extends Transform {

  root: string;
  entrypoint: string;
  shell: string;
  fragments: string[];
  allFragments: string[];

  resolver: StreamResolver;
  loader: Loader;
  analyzer: Analyzer;

  files = new Map<string, File>();

  _analyzeResolve: (DepsIndex) => void;
  analyze: Promise<DepsIndex>;

  constructor(root: string, entrypoint: string, shell: string, fragments: string[]) {
    super({objectMode: true});
    this.root = root;
    this.entrypoint = entrypoint;
    this.shell = shell;
    this.fragments = fragments;

    this.allFragments = [];
    // It's important that shell is first for document-ordering of imports
    if (shell) {
      this.allFragments.push(shell);
    }

    if (entrypoint && !shell && fragments.length === 0) {
      this.allFragments.push(entrypoint);
    }

    if (fragments) {
      this.allFragments = this.allFragments.concat(fragments);
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
    if (this.isFragment(file)) {
      callback(null, null);
    } else {
      callback(null, file);
    }

  }

  _flush(done: (error?) => void) {
    this._getDepsToEntrypointIndex().then((depsIndex) => {
      // push held back files
      for (let entrypoint of this.allFragments) {
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

  isFragment(file): boolean {
    return this.allFragments.indexOf(file.path) !== -1;
  }

  _getDepsToEntrypointIndex(): Promise<DepsIndex> {
    // TODO: tsc is being really weird here...
    let depsPromises = <Promise<DocumentDeps>[]>this.allFragments.map(
        (e) => this._getDependencies(e));

    return Promise.all(depsPromises).then((value: any) => {
      // tsc was giving a spurious error with `allDeps` as the parameter
      let allDeps: DocumentDeps[] = <DocumentDeps[]>value;

      // An index of dependency -> fragments that depend on it
      let depsToFragments = new Map<string, string[]>();

      // An index of fragments -> dependencies
      let fragmentToDeps = new Map<string, string[]>();

      let fragmentToFullDeps = new Map<string, DocumentDeps>();

      console.assert(this.allFragments.length === allDeps.length);

      for (let i = 0; i < allDeps.length; i++) {
        let fragment = this.allFragments[i];
        let deps: DocumentDeps = allDeps[i];
        console.assert(deps != null, `deps is null for ${fragment}`);

        fragmentToDeps.set(fragment, deps.imports);
        fragmentToFullDeps.set(fragment, deps);

        for (let dep of deps.imports) {
          let entrypointList;
          if (!depsToFragments.has(dep)) {
            entrypointList = [];
            depsToFragments.set(dep, entrypointList);
          } else {
            entrypointList = depsToFragments.get(dep);
          }
          entrypointList.push(fragment);
        }
      }
      return {
        depsToFragments,
        fragmentToDeps,
        fragmentToFullDeps,
      };
    });
  }
  /**
   * Attempts to retreive document-order transitive dependencies for `url`.
   */
  _getDependencies(url: string): Promise<DocumentDeps> {
    let documents = this.analyzer.parsedDocuments;
    let dir = path.dirname(url);
    return this.analyzer.metadataTree(url)
        .then((tree) => this._getDependenciesFromDescriptor(tree, dir));
  }

  _getDependenciesFromDescriptor(descriptor: DocumentDescriptor, dir: string): DocumentDeps {
    let allHtmlDeps = [];
    let allScriptDeps = new Set<string>();
    let allStyleDeps = new Set<string>();

    let deps: DocumentDeps = this._collectScriptsAndStyles(descriptor);
    deps.scripts.forEach((s) => allScriptDeps.add(path.resolve(dir, s)));
    deps.styles.forEach((s) => allStyleDeps.add(path.resolve(dir, s)));
    if (descriptor.imports) {
      let queue = descriptor.imports.slice();
      while (queue.length > 0) {
        let next = queue.shift();
        if (!next.href) {
          continue;
        }
        allHtmlDeps.push(next.href);
        let childDeps = this._getDependenciesFromDescriptor(next, path.dirname(next.href));
        allHtmlDeps = allHtmlDeps.concat(childDeps.imports);
        childDeps.scripts.forEach((s) => allScriptDeps.add(s));
        childDeps.styles.forEach((s) => allStyleDeps.add(s));
      }
    }

    return {
      scripts: Array.from(allScriptDeps),
      styles: Array.from(allStyleDeps),
      imports: allHtmlDeps,
    };
  }

  _collectScriptsAndStyles(tree: DocumentDescriptor): DocumentDeps {
    let scripts = [];
    let styles = [];
    tree.html.script.forEach((script) => {
      if (script['__hydrolysisInlined']) {
        scripts.push(script['__hydrolysisInlined']);
      }
    });
    tree.html.style.forEach((style) => {
      let href = getAttribute(style, 'href');
      if (href) {
        styles.push(href);
      }
    });
    return {
      scripts,
      styles
    }
  }
}

export interface DepsIndex {
  depsToFragments: Map<string, string[]>;
  // TODO(garlicnation): Remove this map.
  // A legacy map from framents to html dependencies.
  fragmentToDeps: Map<string, string[]>;
  // A map from frament urls to html, js, and css dependencies.
  fragmentToFullDeps: Map<string, DocumentDeps>;
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
        logger.info('No file found for', filepath);
      }
      return true;
    }
    return false;
  }
}
