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
import * as gulp from 'gulp';
import * as gulpif from 'gulp-if';
import * as gutil from 'gulp-util';
import mergeStream = require('merge-stream');
import * as minimatch from 'minimatch';
import * as path from 'path';
import {PassThrough, Readable} from 'stream';
import File = require('vinyl');
import * as vfs from 'vinyl-fs';

import {Bundler} from './bundle';
import {HtmlProject} from './html-project';
import {Logger} from './logger';
import {optimize, OptimizeOptions} from './optimize';
import {waitForAll, compose, ForkedVinylStream} from './streams';
import {StreamResolver} from './stream-resolver';
import {generateServiceWorker} from './sw-precache';
import {VulcanizeTransform} from './vulcanize';

// non-ES compatible modules
const findConfig = require('liftoff/lib/find_config');
const minimatchAll = require('minimatch-all');

export interface BuildOptions {
  main?: string;
  shell?: string;
  entrypoints?: string[];
  sources?: string[];
  dependencies?: string[];
}

process.on('uncaughtException', (err) => {
  console.log(`Caught exception: ${err}`);
  console.error(err.stack);
});

export function build(options?: BuildOptions): Promise<any> {
  return new Promise<any>((resolve, _) => {
    let root = process.cwd();
    let main = path.resolve(root, options && options.main || 'index.html');
    let shell = path.resolve(root, options && options.shell);
    let entrypoints = (options && options.entrypoints || []).map((p) => path.resolve(root, p));
    let sources = (options && options.sources || ['src/**/*']).map((p) => path.resolve(root, p));;
    let dependencies = (options && options.sources || ['bower_components/**/*']).map((p) => path.resolve(root, p));

    let allSources = [];
    allSources.push(main);
    if (shell) allSources.push(shell);
    allSources = Array.prototype.concat.apply(allSources, entrypoints);
    allSources = Array.prototype.concat.apply(allSources, sources);

    let allEntrypoints = [];
    if (shell) allEntrypoints.push(shell);
    allEntrypoints = Array.prototype.concat.apply(allEntrypoints, entrypoints);

    let optimizeOptions: OptimizeOptions = {
      css: {
        stripWhitespace: true
      },
      js: {
        minify: true
      }
    };

    let gulpfile = getGulpfile();
    let userTransformers = gulpfile && gulpfile.transformers;

    let sourcesProject = new HtmlProject();
    let depsProject = new HtmlProject();
    let bundler = new Bundler(root, shell, entrypoints);

    let sourcesStream =
      vfs.src(allSources, {cwdbase: true})
        .pipe(sourcesProject.split)
        .pipe(compose((userTransformers)))
        .pipe(optimize(optimizeOptions))
        .pipe(sourcesProject.rejoin);

    let depsStream =
      vfs.src(dependencies, {cwdbase: true})
        .pipe(depsProject.split)
        .pipe(optimize(optimizeOptions))
        .pipe(depsProject.rejoin);

    let allFiles = mergeStream(sourcesStream, depsStream);

    let unbundledPhase = new ForkedVinylStream(allFiles)
      .pipe(vfs.dest('build/unbundled'))

    let bundledPhase = new ForkedVinylStream(allFiles)
      .pipe(bundler.bundle)
      .pipe(vfs.dest('build/bundled'));

    waitForAll([unbundledPhase, bundledPhase])
      .then((_) => {
        console.log('all done!');
        let deps = Array.from(bundler.streamResolver.requestedUrls.values());
        return generateServiceWorker(root, main, deps);
      }).then((workerContent) => {
        fs.writeFileSync(path.join('build/bundled', 'service-worker.js'),
          workerContent);
      }).then(resolve);
  });
}

function getGulpfile(): any {
  let gulpfilePath = findConfig({
    searchPaths: [process.cwd()], // TODO: root?
    configNameSearch: 'gulpfile.js',
  });
  return gulpfilePath && require(gulpfilePath);
}
