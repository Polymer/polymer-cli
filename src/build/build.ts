/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import * as gulp from 'gulp';
import * as gulpif from 'gulp-if';
import * as gutil from 'gulp-util';
import * as minimatch from 'minimatch';
import File = require('vinyl');
import * as vfs from 'vinyl-fs';
import {UglifyStream} from './uglify-stream';

import {HtmlProject} from './html-project';
import {StreamResolver} from './stream-resolver';

const print = require('gulp-print');

const findConfig = require('liftoff/lib/find_config');
const vulcanize = require('gulp-vulcanize');

import {Transform} from 'stream';
class StripPrefixStream extends Transform {
  base: string;
  constructor(base: string){
    super({objectMode: true});
    this.base = base;
  }
  _transform(file: File, encoding: string, callback:(error?, data?) => void): void {
    if (file.path.startsWith(this.base)) {
      console.log('path:', file.path, 'base:', file.path, 'cwd:', file.cwd);
      file.path = file.path.substring(this.base.length);
      file.cwd = '/';
      file.base = '/';
      console.log('path:', file.path, 'base:', file.path, 'cwd:', file.cwd);
    } else {
      console.error('weird base', file.path);
    }
    callback(null, file);
  }
}
class Logger extends Transform {
  base: string;
  constructor(base: string){
    super({objectMode: true});
    this.base = base;
  }
  _transform(file: File, encoding: string, callback:(error?, data?) => void): void {
    console.log(this.base, file.path);
    callback(null, file);
  }
}

export function build(entrypoint, sources): Promise<any> {
  return new Promise<any>((resolve, _) => {

    entrypoint = entrypoint || 'index.html';
    sources = sources || ['{src,test}/**/*'];
    let e = [entrypoint];
    sources = e.concat.apply(e, sources);

    let gulpfilePath = findConfig({
      searchPaths: [process.cwd()],
      configNameSearch: 'gulpfile.js',
    });
    let gulpfile = gulpfilePath && require(gulpfilePath);
    let userTransformers = gulpfile && gulpfile.transformers;

    let project = new HtmlProject();
    let uglifyPipe = new UglifyStream();
    let splitPhase = vfs.src(sources)
      .pipe(new StripPrefixStream(process.cwd()))
      .pipe(project.split);

    let userPhase = splitPhase;
    if (userTransformers) {
      for (let transformer of userTransformers) {
        userPhase = userPhase.pipe(transformer);
      }
    }
    let streamResolver = new StreamResolver({
        sources: sources,
        entrypoint: entrypoint,
        root: process.cwd(),
        redirect: 'bower_components/',
      });
    let joinPhase = userPhase
      .pipe(gulpif(file =>
        minimatch(file.path, '*.js', {matchBase: true}),
        uglifyPipe
      ))
      .pipe(new Logger('pre-stream'))
      .pipe(project.rejoin)
      .pipe(streamResolver)
      .pipe(print((fn) => `post-stream ${fn}`))
      .pipe(gulpif((file) => minimatch(file.path, entrypoint, {
          matchBase: true,
        }), vulcanize({
          fsResolver: streamResolver,
          inlineScripts: true,
          inlineCss: true,
          stripComments: true
        })
      ))
      .pipe(print((fn) => `post-vulc ${fn}`))
      // .pipe(gulp.dest('build'))
      .on('finish', () => {
        resolve(null);
      });
  });
}
