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
import * as stream from 'stream';

import {UglifyTransform} from './uglify-transform';
import {compose} from './streams';

// not ES compatible
const cssSlam = require('css-slam').gulp;
const htmlmin = require('gulp-html-minifier');

export interface OptimizeOptions {
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

export function optimize(options?: OptimizeOptions) {
  let transforms = [];

  if (options) {
    if (options.js && options.js.minify) {
      transforms.push(new UglifyTransform());
    }
    if (options.css && options.css.stripWhitespace) {
      transforms.push(cssSlam());
    }
    if (options.html) {
      transforms.push(gulpif(/\.html$/, htmlmin(options.html)))
    }
  }
  return compose(transforms);
}
