/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import * as dom5 from 'dom5';
import * as parse5 from 'parse5';
import * as path from 'path';
import * as logging from 'plylog';
import {BuildAnalyzer, DepsIndex, PolymerProject} from 'polymer-build';
import {urlFromPath} from 'polymer-build/lib/path-transformers';
import {ProjectConfig} from 'polymer-project-config';
import {Transform} from 'stream';

import File = require('vinyl');

let logger = logging.getLogger('cli.build.prefech');

export class PrefetchTransform extends Transform {
  config: ProjectConfig;
  fileMap: Map<string, File>;
  analyzer: BuildAnalyzer;

  constructor(project: PolymerProject) {
    super({objectMode: true});
    this.config = project.config;
    this.analyzer = project.analyzer;
    this.fileMap = new Map<string, File>();
  }

  pullUpDeps(file: File, deps: string[], rel: 'import'|'prefetch') {
    const contents = file.contents!.toString();
    const url = urlFromPath(this.config.root, file.path);
    const updated = createLinks(contents, url, deps, rel);
    file.contents = new Buffer(updated);
  }

  _transform(
      file: File,
      _encoding: string,
      callback: (error?: any, file?: File) => void) {
    if (this.isImportantFile(file)) {
      // hold on to the file for safe keeping
      this.fileMap.set(file.path, file);
      callback(null);
    } else {
      callback(null, file);
    }
  }

  isImportantFile(file: File) {
    return file.path === this.config.entrypoint ||
        this.config.allFragments.indexOf(file.path) > -1;
  }

  _flush(done: (error?: any) => void) {
    if (this.fileMap.size === 0) {
      return done();
    }
    this.analyzer.analyzeDependencies.then((depsIndex: DepsIndex) => {
      const fragmentToDeps = new Map(depsIndex.fragmentToDeps);

      if (this.config.entrypoint && this.config.shell) {
        const file = this.fileMap.get(this.config.entrypoint);
        if (file == null)
          throw new TypeError('file is null');

        // forward shell's dependencies to main to be prefetched
        const deps = fragmentToDeps.get(this.config.shell);
        if (deps) {
          this.pullUpDeps(file, deps, 'prefetch');
        }
        this.push(file);
        this.fileMap.delete(this.config.entrypoint);
      }

      for (const importUrl of this.config.allFragments) {
        const file = this.fileMap.get(importUrl);
        if (file == null)
          throw new TypeError('file is null');

        const deps = fragmentToDeps.get(importUrl);
        if (deps) {
          this.pullUpDeps(file, deps, 'import');
        }
        this.push(file);
        this.fileMap.delete(importUrl);
      }

      for (let leftover of this.fileMap.keys()) {
        logger.warn(
            'File was listed in fragments but not found in stream:', leftover);
        this.push(this.fileMap.get(leftover));
        this.fileMap.delete(leftover);
      }

      done();
    });
  }
}

/**
 * Returns the given HTML updated with import or prefetch links for the given
 * dependencies. The given url and deps are expected to be project-relative
 * URLs (e.g. "index.html" or "src/view.html").
 *
 * When rel is prefetch, we assume we have the top-level entry point (which can
 * be served from any URL), and output absolute URLs. Otherwise we output
 * relative URLs.
 */
export function createLinks(
    html: string, url: string, deps: string[], rel: 'import'|'prefetch'):
    string {
  const ast = parse5.parse(html);
  // parse5 always produces a <head> element.
  const head = dom5.query(ast, dom5.predicates.hasTagName('head'))!;
  for (const dep of deps) {
    let href;
    if (rel === 'prefetch') {
      href = '/' + dep;
    } else {
      href = path.posix.relative(path.posix.dirname(url), dep);
    }
    const link = dom5.constructors.element('link');
    dom5.setAttribute(link, 'rel', rel);
    dom5.setAttribute(link, 'href', href);
    dom5.append(head, link);
  }
  return parse5.serialize(ast);
}
