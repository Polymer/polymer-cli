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
import * as path from 'path';
import {Transform} from 'stream';
import File = require('vinyl');

import {StreamAnalyzer, DepsIndex} from './analyzer';
import {Logger} from './logger';
import {compose} from './streams';

// non-ES module
const minimatchAll = require('minimatch-all');
const through = require('through2').obj;
const Vulcanize = require('vulcanize');

export class Bundler extends Transform {

  root: string;
  shell: string;
  entrypoints: string[];
  allEntrypoints: string[];

  sharedBundlePath: string;
  sharedBundleUrl: string;

  analyzer: StreamAnalyzer;
  sharedFile: File;

  _verboseLogging = false;

  constructor(root: string, shell: string, entrypoints: string[],
      analyzer: StreamAnalyzer) {
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
    this.analyzer = analyzer;

    this.sharedBundlePath = 'shared-bundle.html';
    this.sharedBundleUrl = path.resolve(root, this.sharedBundlePath);
  }

  _transform(
      file: File,
      encoding: string,
      callback: (error?, data?: File) => void
    ) : void {

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
      for (let entrypoint of this.allEntrypoints) {
        let file = this.analyzer.files.get(entrypoint);
        let contents = bundles.get(entrypoint);
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
    return this.allEntrypoints.indexOf(file.path) !== -1;
  }

  _buildBundles(): Promise<Map<string, string>> {
    return this._getBundles().then((bundles) => {
      if (this._verboseLogging) {
        console.log('bundles:');
        for (let url of bundles.keys()) {
          let deps = bundles.get(url);
          if (!deps) {
            console.log('    no deps?');
          } else {
            console.log(`  ${url} (${deps.length}):`);
            for (let dep of deps) {
              console.log(`    ${dep}`);
            }
          }
        }
      }

      let sharedDepsBundle = this.shell || this.sharedBundleUrl;
      let sharedDeps = bundles.get(sharedDepsBundle);
      let promises = [];

      if (this.shell) {
        let shellFile = this.analyzer.files.get(this.shell);
        console.assert(shellFile != null);
        let newShellContent = this._addSharedImportsToShell(bundles);
        shellFile.contents = new Buffer(newShellContent);
      }

      for (let entrypoint of this.allEntrypoints) {
        let addedImports = (entrypoint == this.shell || !this.shell)
            ? []
            : [path.relative(path.dirname(entrypoint), sharedDepsBundle)]
        let excludes = (entrypoint == this.shell)
            ? []
            : sharedDeps.concat(sharedDepsBundle);

        promises.push(new Promise((resolve, reject) => {
          var vulcanize = new Vulcanize({
            abspath: null,
            fsResolver: this.analyzer.resolver,
            addedImports: addedImports,
            stripExcludes: excludes,
            inlineScripts: true,
            inlineCss: true,
            inputUrl: entrypoint,
          });
          vulcanize.process(null, (err, doc) => {
            if (err) {
              reject(err);
            } else {
              if (this._verboseLogging) {
                console.log(`vulcanized doc for ${entrypoint}: ${doc.length}`);
              }
              resolve({
                url: entrypoint,
                contents: doc,
              });
            }
          });
        }));
      }
      // vulcanize the shared bundle
      if (!this.shell && sharedDeps) {
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
          .map((d) => {
            console.assert(d.startsWith(this.root));
            let url = d.substring(this.root.length);
            return `<link rel="import" href="${url}">`;
          })
          .join('\n');

      if (this._verboseLogging) {
        console.log('shared-bundle.html:\n', contents);
      }

      this.sharedFile = new File({
        cwd: this.root,
        base: this.root,
        path: this.sharedBundleUrl,
        contents: new Buffer(contents),
      });

      // make the shared bundle visible to vulcanize
      this.analyzer.addFile(this.sharedFile);

      var vulcanize = new Vulcanize({
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
      let depsToEntrypoints = indexes.depsToEntrypoints;
      let entrypointToDeps = indexes.entrypointToDeps;
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
      }

      // We want to collect dependencies that appear in > 1 entrypoint, but
      // we need to collect them in document order, so rather than iterate
      // directly through each dependency in depsToEntrypoints, we iterate
      // through entrypoints in entrypointToDeps, which has dependencies in
      // order for each entrypoint. Then we iterate through dependencies for
      // each entrypoint and look up how many entrypoints depend on it.
      // This assumes an ordering between entrypoints, since they could have
      // conflicting orders between their top level imports. The shell should
      // always come first.
      for (let entrypoint of entrypointToDeps.keys()) {
        let dependencies = entrypointToDeps.get(entrypoint);
        for (let dep of dependencies) {
          let entrypointCount = depsToEntrypoints.get(dep).length;
          if (entrypointCount > 1) {
            if (this.shell) {
              addImport(this.shell, dep);
              // addImport(entrypoint, this.shell);
            } else {
              addImport(this.sharedBundleUrl, dep);
              addImport(entrypoint, this.sharedBundleUrl);
            }
          } else {
            addImport(entrypoint, dep);
          }
        }
      }
      return bundles;
    });
  }

}
