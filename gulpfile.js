/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

'use strict';

const depcheck = require('depcheck');
const eslint = require('gulp-eslint');
const fs = require('fs-extra');
const gulp = require('gulp');
const mergeStream = require('merge-stream');
const mocha = require('gulp-spawn-mocha');
const path = require('path');
const runSeq = require('run-sequence');
const tslint = require('gulp-tslint');
const typescript = require('gulp-typescript');
const uglify = require('uglify-js');
const babelCore = require('babel-core');

const tsProject = typescript.createProject('tsconfig.json');

gulp.task('lint', ['tslint', 'eslint', 'depcheck']);

gulp.task('clean', (done) => {
  fs.remove(path.join(__dirname, 'lib'), done);
});

gulp.task('build', (done) => {
  runSeq('clean', ['compile', 'gen-babel-helpers'], done);
});

gulp.task('compile', () => {
  let tsReporter = typescript.reporter.defaultReporter();
  return mergeStream(
             tsProject.src().pipe(tsProject(tsReporter)),
             gulp.src(['src/**/*', '!src/**/*.ts']))
      .pipe(gulp.dest('lib'));
});

gulp.task(
    'test',
    ['build'],
    () => gulp.src('test/unit/**/*_test.js', {read: false}).pipe(mocha({
      ui: 'tdd',
      reporter: 'spec',
    })));

gulp.task(
    'test:integration',
    ['build'],
    () =>
        gulp.src(['test/integration/**/*_test.js'], {read: false}).pipe(mocha({
          ui: 'tdd',
          reporter: 'spec',
        })));


gulp.task(
    'tslint',
    () => gulp.src('src/**/*.ts')
              .pipe(tslint({
                configuration: 'tslint.json',
                formatter: 'verbose',
              }))
              .pipe(tslint.report()));

gulp.task(
    'eslint',
    () => gulp.src('test/**/*_test.js')
              .pipe(eslint())
              .pipe(eslint.format())
              .pipe(eslint.failAfterError()));

gulp.task('depcheck', () => {
  return depcheck(__dirname, {
           // "@types/*" dependencies are type declarations that are
           // automatically
           // loaded by TypeScript during build. depcheck can't detect this
           // so we ignore them here. Same with babel plugins.
           ignoreMatches:
               ['@types/*', 'vinyl', 'babel-plugin-external-helpers']
         })
      .then((result) => {
        let invalidFiles = Object.keys(result.invalidFiles) || [];
        let invalidJsFiles = invalidFiles.filter((f) => f.endsWith('.js'));
        if (invalidJsFiles.length > 0) {
          throw new Error(`Invalid files: ${invalidJsFiles}`);
        }
        if (result.dependencies.length) {
          throw new Error(`Unused dependencies: ${result.dependencies}`);
        }
      });
});

/*
 * There doesn't seem to be documentation on what helpers are available, or
 * which helpers are required for which transforms. The
 * source is here:
 * https://github.com/babel/babel/blob/6.x/packages/babel-helpers/src/helpers.js
 *
 * This list is an educated guess at the helpers needed for our transform set
 * of ES2015 - modules. When we switch to loose mode we should update the list.
 *
 * All helpers are listed here, with some commented out, so it's clear what
 * we've excluded.
 */
const babelHelperWhitelist = [
  'typeof',  // Symbol support, for IE11
  // 'jsx', // we don't support JSX
  // 'asyncIterator', // async-iterators are not in ES2015
  // 'asyncGenerator', // async-iterators are not in ES2015
  // 'asyncGeneratorDelegate', // async-iterators are not in ES2015
  // 'asyncToGenerator', // async functions are not in ES2015
  'classCallCheck',
  'createClass',
  'defineEnumerableProperties',
  'defaults',  // used to make `obj.__proto__ = bar` work
  'defineProperty',
  'extends',   // used when setting __proto__
  'get',       // needed for class compilation
  'inherits',  // used for es6 class inheritance
  'instanceof',
  // 'interopRequireDefault', // for modules support
  // 'interopRequireWildcard', // for modules support
  'newArrowCheck',  // confirms that `this` is correct inside arrow function
                    // body
  'objectDestructuringEmpty',
  'objectWithoutProperties',
  'possibleConstructorReturn',  // can we exclude with loose?
  // 'selfGlobal', // not needed. `global` is not ES2015
  'set',  // difficult to tell if needed
  'slicedToArray',
  // 'slicedToArrayLoose',
  'taggedTemplateLiteral',
  // 'taggedTemplateLiteralLoose',
  'temporalRef',  // not needed in loose?
  'temporalUndefined',
  'toArray',
  'toConsumableArray',
];

gulp.task('gen-babel-helpers', () => {
  const helpersCode = babelCore.buildExternalHelpers(babelHelperWhitelist);
  const {code: minified} = uglify.minify(helpersCode, {fromString: true});
  fs.mkdirpSync('./lib/build');
  fs.writeFileSync(
      './lib/build/babel-helpers.min.js', minified, {encoding: 'utf-8'});
});
