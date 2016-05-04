/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import * as path from 'path';

import * as gulp from 'gulp';
import * as gulpif from 'gulp-if';
import * as gutil from 'gulp-util';
import mergeStream = require('merge-stream');
import * as minimatch from 'minimatch';
import File = require('vinyl');
import * as vfs from 'vinyl-fs';

import {HtmlProject} from './html-project';
import {StreamResolver} from './stream-resolver';
import {optimizePipe} from './util';

// non-ES compatible modules
const findConfig = require('liftoff/lib/find_config');
const vulcanize = require('gulp-vulcanize');

export function build(entrypoint, sources): Promise<any> {
  return new Promise<any>((resolve, _) => {

    entrypoint = entrypoint || path.resolve('index.html');
    sources = sources || ['src/**/*'];
    let e = [entrypoint];
    sources = e.concat.apply(e, sources);

    let gulpfilePath = findConfig({
      searchPaths: [process.cwd()],
      configNameSearch: 'gulpfile.js',
    });
    let gulpfile = gulpfilePath && require(gulpfilePath);
    let userTransformers = gulpfile && gulpfile.transformers;

    let project = new HtmlProject();
    let splitPhase = vfs.src(sources, {cwdbase: true})
      .pipe(project.split);

    let userPhase = splitPhase;
    if (userTransformers) {
      for (let transformer of userTransformers) {
        userPhase = userPhase.pipe(transformer);
      }
    }
    userPhase = optimizePipe(userPhase).pipe(project.rejoin);

    let depsProject = new HtmlProject();
    let depsPipe =
      vfs.src('bower_components/**/*', {cwdbase: true})
      .pipe(depsProject.split);

    depsPipe = optimizePipe(depsPipe)
      .pipe(depsProject.rejoin);

    let streamResolver = new StreamResolver({
        entrypoint: entrypoint,
        basePath: process.cwd(),
        root: process.cwd(),
        redirect: 'bower_components/',
      });

    let joinPhase = mergeStream(userPhase, depsPipe)
      .pipe(streamResolver)
      .pipe(gulpif((file) => minimatch(file.path, entrypoint, {
          matchBase: true,
        }), vulcanize({
          fsResolver: streamResolver,
          inlineScripts: true,
          inlineCss: true,
          stripComments: true
        })
      ))
      .pipe(gulp.dest('build'))
      .on('finish', () => {
        resolve(null);
      });
  });
}
