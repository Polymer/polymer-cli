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
import * as gulpif from 'gulp-if';
import {posix as path} from 'path';
import * as osPath from 'path';
import {Transform} from 'stream';
import File = require('vinyl');
import * as logging from 'plylog';

import {StreamAnalyzer, DepsIndex} from './analyzer';
import {compose} from './streams';

// non-ES module
const minimatchAll = require('minimatch-all');
const through = require('through2').obj;
const Vulcanize = require('vulcanize');
let logger = logging.getLogger('cli.build.bundle');

export class Bundler extends Transform {

  entrypoint: string;
  root: string;
  shell: string;
  fragments: string[];
  allFragments: string[];

  sharedBundleUrl: string;

  analyzer: StreamAnalyzer;
  sharedFile: File;

  constructor(root: string, entrypoint: string,
      shell: string, fragments: string[], analyzer: StreamAnalyzer) {
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

    this.analyzer = analyzer;
    this.sharedBundleUrl = 'shared-bundle.html';
  }

  _transform(
      file: File,
      encoding: string,
      callback: (error?, data?: File) => void
    ): void {

    // If this is the entrypoint, hold on to the file, so that it's fully
    // analyzed by the time down-stream transforms see it.
    if (this.isEntrypoint(file)) {
      callback(null, null);
    } else {
      callback(null, file);
    }

  }

  _flush(done: (error?) => void) {
    this._buildBundles().then((bundles: Map<string, string>) => {
      for (let fragment of this.allFragments) {
        let file = this.analyzer.files.get(fragment);
        let contents = bundles.get(fragment);
        file.contents = new Buffer(contents);
        this.push(file);
      }
      let sharedBundle = bundles.get(this.sharedBundleUrl);
      if (sharedBundle) {
        let contents = bundles.get(this.sharedBundleUrl);
        this.sharedFile.contents = new Buffer(contents);
        this.push(this.sharedFile);
      }
      // end the stream
      done();
    });
  }

  isEntrypoint(file): boolean {
    return this.allFragments.indexOf(file.path) !== -1;
  }

  _buildBundles(): Promise<Map<string, string>> {
    return this._getBundles().then((bundles) => {
      let sharedDepsBundle = this.shell || this.sharedBundleUrl;
      let sharedDeps = bundles.get(sharedDepsBundle) || [];
      let promises = [];

      if (this.shell) {
        let shellFile = this.analyzer.files.get(this.shell);
        console.assert(shellFile != null);
        let newShellContent = this._addSharedImportsToShell(bundles);
        shellFile.contents = new Buffer(newShellContent);
      }

      for (let fragment of this.allFragments) {
        let addedImports = (fragment === this.shell && this.shell)
            ? []
            : [path.relative(path.dirname(fragment), sharedDepsBundle)];
        let excludes = (fragment === this.shell && this.shell)
            ? []
            : sharedDeps.concat(sharedDepsBundle);

        promises.push(new Promise((resolve, reject) => {
          let vulcanize = new Vulcanize({
            abspath: null,
            fsResolver: this.analyzer.resolver,
            addedImports: addedImports,
            stripExcludes: excludes,
            inlineScripts: true,
            inlineCss: true,
            inputUrl: fragment,
          });
          vulcanize.process(null, (err, doc) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                url: fragment,
                contents: doc,
              });
            }
          });
        }));
      }
      // vulcanize the shared bundle
      if (!this.shell && sharedDeps && sharedDeps.length !== 0) {
        logger.info(`generating shared bundle`);
        promises.push(this._generateSharedBundle(sharedDeps));
      }
      return Promise.all(promises).then((bundles) => {
        // convert {url,contents}[] into a Map
        let contentsMap = new Map();
        for (let bundle of bundles) {
          contentsMap.set(bundle.url, bundle.contents);
        }
        return contentsMap;
      });
    });
  }

  _addSharedImportsToShell(bundles: Map<string, string[]>): string {
    console.assert(this.shell != null);
    let shellDeps = bundles.get(this.shell)
        .map((d) => path.relative(path.dirname(this.shell), d));

    let file = this.analyzer.files.get(this.shell);
    console.assert(file != null);
    let contents = file.contents.toString();
    let doc = dom5.parse(contents);
    let imports = dom5.queryAll(doc, dom5.predicates.AND(
      dom5.predicates.hasTagName('link'),
      dom5.predicates.hasAttrValue('rel', 'import')
    ));

    // Remove all imports that are in the shared deps list so that we prefer
    // the ordering or shared deps. Any imports left should be independent of
    // ordering of shared deps.
    let shellDepsSet = new Set(shellDeps);
    for (let _import of imports) {
      if (shellDepsSet.has(dom5.getAttribute(_import, 'href'))) {
        dom5.remove(_import);
      }
    }

    // Append all shared imports to the end of <head>
    let head = dom5.query(doc, dom5.predicates.hasTagName('head'));
    for (let dep of shellDeps) {
      let newImport = dom5.constructors.element('link');
      dom5.setAttribute(newImport, 'rel', 'import');
      dom5.setAttribute(newImport, 'href', dep);
      dom5.append(head, newImport);
    }
    let newContents = dom5.serialize(doc);
    return newContents;
  }

  _generateSharedBundle(sharedDeps: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      let contents = sharedDeps
          .map((d) => `<link rel="import" href="${d}">`)
          .join('\n');

      let sharedFsPath = osPath.resolve(this.root, this.sharedBundleUrl);
      this.sharedFile = new File({
        cwd: this.root,
        base: this.root,
        path: sharedFsPath,
        contents: new Buffer(contents),
      });

      // make the shared bundle visible to vulcanize
      this.analyzer.addFile(this.sharedFile);

      let vulcanize = new Vulcanize({
        abspath: null,
        fsResolver: this.analyzer.resolver,
        inlineScripts: true,
        inlineCss: true,
        inputUrl: this.sharedBundleUrl,
      });
      vulcanize.process(null, (err, doc) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            url: this.sharedBundleUrl,
            contents: doc,
          });
        }
      });
    });
  }

  _getBundles() {
    return this.analyzer.analyze.then((indexes) => {
      let depsToEntrypoints = indexes.depsToFragments;
      let fragmentToDeps = indexes.fragmentToDeps;
      let bundles = new Map<string, string[]>();

      let addImport = (from: string, to: string) => {
        let imports;
        if (!bundles.has(from)) {
          imports = [];
          bundles.set(from, imports);
        } else {
          imports = bundles.get(from);
        }
        if (!imports.includes(to)) {
          imports.push(to);
        }
      };

      // We want to collect dependencies that appear in > 1 entrypoint, but
      // we need to collect them in document order, so rather than iterate
      // directly through each dependency in depsToEntrypoints, we iterate
      // through fragments in fragmentToDeps, which has dependencies in
      // order for each fragment. Then we iterate through dependencies for
      // each fragment and look up how many fragments depend on it.
      // This assumes an ordering between fragments, since they could have
      // conflicting orders between their top level imports. The shell should
      // always come first.
      for (let fragment of fragmentToDeps.keys()) {
        let dependencies = fragmentToDeps.get(fragment);
        for (let dep of dependencies) {
          let fragmentCount = depsToEntrypoints.get(dep).length;
          if (fragmentCount > 1) {
            if (this.shell) {
              addImport(this.shell, dep);
              // addImport(entrypoint, this.shell);
            } else {
              addImport(this.sharedBundleUrl, dep);
              addImport(fragment, this.sharedBundleUrl);
            }
          } else {
            addImport(fragment, dep);
          }
        }
      }
      return bundles;
    });
  }

}
