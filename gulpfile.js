/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

const fs = require('fs-extra');
const gulp = require('gulp');
const mergeStream = require('merge-stream');
const mocha = require('gulp-mocha');
const path = require('path');
const typescript = require('gulp-typescript');
const typings = require('gulp-typings');

var tsProject = typescript.createProject('tsconfig.json');

gulp.task('init', () => gulp.src("./typings.json").pipe(typings()));

gulp.task('build', () =>
  mergeStream(
    gulp.src('src/**/*.ts').pipe(typescript(tsProject)),
    gulp.src(['src/**/*', '!src/**/*.ts'])
  ).pipe(gulp.dest('lib'))
);

gulp.task('clean', (done) => {
  fs.remove(path.join(__dirname, 'lib'), done);
});

gulp.task('build-all', ['clean', 'init', 'build']);

gulp.task('test', ['build'], () =>
  gulp.src('test/**/*_test.js', {read: false})
      .pipe(mocha({
        ui: 'tdd',
        reporter: 'spec',
      }))
);
