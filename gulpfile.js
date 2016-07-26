/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

'use strict';

const depcheck = require('depcheck');
const eslint = require('gulp-eslint');
const fs = require('fs-extra');
const gulp = require('gulp');
const mergeStream = require('merge-stream');
const mocha = require('gulp-mocha');
const path = require('path');
const runSeq = require('run-sequence');
const tslint = require("gulp-tslint");
const typescript = require('gulp-typescript');
const typings = require('gulp-typings');

const tsProject = typescript.createProject('tsconfig.json');

gulp.task('init', () => gulp.src("./typings.json").pipe(typings()));

gulp.task('lint', ['tslint', 'eslint', 'depcheck']);

gulp.task('build', () =>
  mergeStream(
    gulp.src('src/**/*.ts').pipe(typescript(tsProject)),
    gulp.src(['src/**/*', '!src/**/*.ts'])
  ).pipe(gulp.dest('lib'))
);

gulp.task('clean', (done) => {
  fs.remove(path.join(__dirname, 'lib'), done);
});

gulp.task('build-all', (done) => {
  runSeq('clean', 'init', 'lint', 'build', done);
});

gulp.task('test', ['build'], () =>
  gulp.src('test/**/*_test.js', {read: false})
      .pipe(mocha({
        ui: 'tdd',
        reporter: 'spec',
      }))
);

gulp.task('tslint', () =>
  gulp.src('src/**/*.ts')
    .pipe(tslint({
      configuration: 'tslint.json',
    }))
    .pipe(tslint.report('verbose')));

gulp.task('eslint', () =>
  gulp.src('test/**/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError()));

gulp.task('depcheck', () =>
  depcheck(__dirname, {ignoreMatches: ['vinyl']})
    .then((result) => {
      let invalidFiles = Object.keys(result.invalidFiles) || [];
      let invalidJsFiles = invalidFiles.filter((f) => f.endsWith('.js'));
      if (invalidJsFiles.length > 0) {
        throw new Error(`Invalid files: ${invalidJsFiles}`);
      }
      if (result.dependencies.length) {
        throw new Error(`Unused dependencies: ${result.dependencies}`);
      }
  }));
