/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import * as gulpif from 'gulp-if';
import * as minimatch from 'minimatch';
import * as stream from 'stream';

import {UglifyTransform} from './uglify-transform';

// not ES compatible
const cssSlam = require('css-slam').gulp;
const htmlmin = require('gulp-html-minifier');

export interface OptimizePipeOptions {
  /**
   * Enable HTML minification
   *
   * Options passed to gulp-html-minifier
   */
  html?: {
    collapseWhitespace?: boolean;
    removeComments?: boolean;
  };
  /**
   * Enable CSS minification
   */
  css?: {
    stripWhitespace?: boolean;
  };
  /**
   * Enable JS minification
   */
  js?: {
    minify?: boolean;
  };
}

export function optimizePipe(stream: stream.Stream,
  options?: OptimizePipeOptions) {
  let outpipe = stream;
  if (options) {
    if (options.js && options.js.minify) {
      outpipe = outpipe.pipe(new UglifyTransform());
    }
    if (options.css && options.css.stripWhitespace) {
      outpipe = outpipe.pipe(cssSlam());
    }
    if (options.html) {
      outpipe = outpipe.pipe(
        gulpif((f) => minimatch(f.path, '*.html', {matchBase: true}),
          htmlmin(options.html))
      )
    }
  }
  return outpipe;
}
