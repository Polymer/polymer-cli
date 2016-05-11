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

export class PrefetchTransform extends Transform {
  root: string;
  prefetchTargets: string[];
  importTargets: string[];
  fileMap: Map<string, File>;
  dependencyMapPromise: Promise<Map<string, string[]>>;

  constructor(
    root: string,
    prefetchTargets: string[],
    importTargets: string[],
    dependencyMapPromise: Promise<Map<string, string[]>>
  ) {
    super({objectMode: true});
    this.root = root;
    this.prefetchTargets = prefetchTargets;
    this.importTargets = importTargets;
    this.dependencyMapPromise = dependencyMapPromise;
    this.fileMap = new Map<string, File>();
  }

  pullUpDeps(
    file: File,
    deps: string[],
    type: 'import' | 'prefetch'
  ){
    let contents = file.contents.toString();
    let ast = dom5.parse(contents);
    const head = dom5.query(ast, dom5.predicates.hasTagName('head'));
    for (let dep of deps) {
      dep = path.relative(file.dirname, dep);
      let link = dom5.constructors.element('link');
      dom5.setAttribute(link, 'rel', type);
      dom5.setAttribute(link, 'href', dep);
      dom5.append(head, link);
    }
    contents = dom5.serialize(ast);
    file.contents = new Buffer(contents);
  }

  _transform(file: File, enc: string, cb: (err?, file?) => void) {
    if (
      this.prefetchTargets.indexOf(file.path) > -1 ||
      this.importTargets.indexOf(file.path) > -1
    ) {
      this.fileMap.set(file.path, file);
      cb();
    } else {
      cb(null, file);
    }
  }

  _flush(done: (err?) => void) {
    if (this.fileMap.size === 0) {
      return done();
    }
    this.dependencyMapPromise.then((map) => {
      for (let prefetch of this.prefetchTargets) {
        let file = this.fileMap.get(prefetch);
        let deps = map.get(prefetch);
        console.log('prefetch', file.path, deps);
        if (deps) {
          this.pullUpDeps(file, deps, 'prefetch');
        }
        this.push(file);
        this.fileMap.delete(prefetch);
      }
      for (let im of this.importTargets) {
        let file = this.fileMap.get(im);
        let deps = map.get(im);
        console.log('import', file.path, deps);
        if (deps) {
          this.pullUpDeps(file, deps, 'import');
        }
        this.push(file);
        this.fileMap.delete(im);
      }
      for (let leftover of this.fileMap.keys()) {
        console.log('unused', leftover);
      }
      this.fileMap.clear();
      done();
    });
  }
}
