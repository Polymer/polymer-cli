/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import clone = require('clone');
import * as fs from 'fs';
import * as gulp from 'gulp';
import * as gulpif from 'gulp-if';
import * as gutil from 'gulp-util';
import mergeStream = require('merge-stream');
import * as path from 'path';
import {PassThrough, Readable} from 'stream';
import File = require('vinyl');
import * as vfs from 'vinyl-fs';

import {StreamAnalyzer, DepsIndex} from './analyzer';
import {Bundler} from './bundle';
import {ProjectConfig} from '../project-config';
import {HtmlProject} from './html-project';
import {Logger} from './logger';
import {optimize, OptimizeOptions} from './optimize';
import {PrefetchTransform} from './prefetch';
import {waitForAll, compose, ForkedVinylStream} from './streams';
import {generateServiceWorker, parsePreCacheConfig, SWConfig} from './sw-precache';

// non-ES compatible modules
const findConfig = require('liftoff/lib/find_config');
const minimatchAll = require('minimatch-all');

export interface BuildOptions {
  sources?: string[];
  dependencies?: string[];
  swPrecacheConfig?: string;
}

process.on('uncaughtException', (error) => {
  console.log(`Caught exception: ${error}`);
  console.error(error.stack);
});

process.on('unhandledRejection', (error) => {
  console.log(`Promise rejection: ${error}`);
  console.error(error.stack);
});

export function build(options?: BuildOptions, config?: ProjectConfig): Promise<any> {
  return new Promise<any>((buildResolve, _) => {
    options = options || {};
    let root = config.root;
    let main = config.main;
    let shell = config.shell;
    let entrypoints = config.entrypoints;
    let swPrecacheConfig = path.resolve(
        root, options.swPrecacheConfig || 'sw-precache-config.js');
    let sources = (options.sources || ['**/*'])
        .map((p) => path.resolve(root, p));
    let dependencies = (options.dependencies || ['bower_components/**/*'])
        .map((p) => path.resolve(root, p));
    let sourceExcludes = [
      '!build',
      '!build/**/*',
      '!bower_components',
      '!bower_components/**/*',
      '!node_modules',
      '!node_modules/**/*',
    ];

    let allSources = [];
    allSources.push(main);
    if (shell) allSources.push(shell);
    allSources = allSources.concat(entrypoints, sources, sourceExcludes);

    let allEntrypoints = [];
    if (shell) allEntrypoints.push(shell);
    allEntrypoints = allEntrypoints.concat(entrypoints);

    let optimizeOptions: OptimizeOptions = {
      html: {
        removeComments: true
      },
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
    let analyzer = new StreamAnalyzer(root, shell, entrypoints);
    let bundler = new Bundler(root, shell, entrypoints, analyzer);

    let sourcesStream =
      vfs.src(allSources, {cwdbase: true, allowEmpty: true})
        .pipe(sourcesProject.split)
        .pipe(compose(userTransformers))
        .pipe(optimize(optimizeOptions))
        .pipe(sourcesProject.rejoin);

    let depsStream =
      vfs.src(dependencies, {cwdbase: true, allowEmpty: true})
        .pipe(depsProject.split)
        .pipe(optimize(optimizeOptions))
        .pipe(depsProject.rejoin)

    let allFiles = mergeStream(sourcesStream, depsStream)
        .pipe(analyzer);

    let serviceWorkerName = 'service-worker.js';

    let unbundledPhase = new ForkedVinylStream(allFiles)
      .pipe(new PrefetchTransform(root, main, shell, entrypoints, analyzer))
      .pipe(vfs.dest('build/unbundled'));

    let bundledPhase = new ForkedVinylStream(allFiles)
      .pipe(bundler)
      .pipe(vfs.dest('build/bundled'));

    let genSW = (buildRoot: string, deps: string[], swConfig: SWConfig) => {
      return generateServiceWorker({
        root,
        main,
        deps,
        buildRoot,
        swConfig: clone(swConfig),
        serviceWorkerPath: path.join(root, buildRoot, serviceWorkerName)
      });
    };

    waitForAll([unbundledPhase, bundledPhase])
      .then(() => analyzer.analyze)
      .then((depsIndex) => {
        let unbundledDeps = Array.from(depsIndex.depsToEntrypoints.keys());
        let bundledDeps = analyzer.allEntrypoints
            .concat(bundler.sharedBundleUrl);

        parsePreCacheConfig(swPrecacheConfig).then((swConfig) => {
          Promise.all([
            genSW('build/unbundled', unbundledDeps, swConfig),
            genSW('build/bundled', bundledDeps, swConfig)
          ]).then(() => {
            buildResolve();
          });
        })
      });
  });
}

function getGulpfile(): any {
  let gulpfilePath = findConfig({
    searchPaths: [process.cwd()], // TODO: root?
    configNameSearch: 'gulpfile.js',
  });
  return gulpfilePath && require(gulpfilePath);
}
