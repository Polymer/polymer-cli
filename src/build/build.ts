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
import {SWPreCacheTransform} from './sw-precache';
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
  swPrecacheConfig?: string;
}

process.on('uncaughtException', (err) => {
  console.log(`Caught exception: ${err}`);
  console.error(err.stack);
});

export function build(options?: BuildOptions): Promise<any> {
  return new Promise<any>((resolve, _) => {
    options = options || {};
    let root = process.cwd();
    let main = path.resolve(root, options.main || 'index.html');
    let shell = options.shell && path.resolve(root, options.shell);
    let entrypoints = (options.entrypoints || [])
        .map((p) => path.resolve(root, p));
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
        .pipe(vfs.src(swPrecacheConfig, {
          cwdbase: true,
          allowEmpty: true,
          passthrough: true
        }));

    let allFiles = mergeStream(sourcesStream, depsStream);

    let serviceWorkerName = 'service-worker.js';

    let unbundledPhase = new ForkedVinylStream(allFiles)
      .pipe(new SWPreCacheTransform({
        root,
        main,
        buildRoot: 'build/unbundled',
        serviceWorkerName,
        configFileName: swPrecacheConfig
      }))
      .pipe(vfs.dest('build/unbundled'))

    // SWPreCacheTransform needs the deps from bundler after bundles are created
    // therefore, give transform a promise that is resolved when bundler is done
    let depsResolve: (value: string[]) => void;
    let depsPromise = new Promise<string[]>((resolve) => {
      depsResolve = resolve;
    });

    let bundledPhase = new ForkedVinylStream(allFiles)
      .pipe(bundler.bundle)
      .on('end', () => {
        // bundler has seen all files, give them to the precache transform
        let depsList = Array.from(bundler.streamResolver.requestedUrls);
        depsResolve(depsList);
      })
      .pipe(new SWPreCacheTransform({
        root,
        main,
        buildRoot: 'build/bundled',
        deps: depsPromise,
        serviceWorkerName,
        configFileName: swPrecacheConfig
      }))
      .pipe(vfs.dest('build/bundled'));
  });
}

function getGulpfile(): any {
  let gulpfilePath = findConfig({
    searchPaths: [process.cwd()], // TODO: root?
    configNameSearch: 'gulpfile.js',
  });
  return gulpfilePath && require(gulpfilePath);
}
