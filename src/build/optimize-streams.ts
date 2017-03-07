/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {transform as babelTransform, TransformOptions as BabelTransformOptions} from 'babel-core';
import * as cssSlam from 'css-slam';
import * as gulpif from 'gulp-if';
import {minify as htmlMinify, Options as HTMLMinifierOptions} from 'html-minifier';
import * as logging from 'plylog';
import {Transform} from 'stream';


const babelPresetES2015 = require('babel-preset-es2015');
const babiliPreset = require('babel-preset-babili');
const babelPresetES2015NoModules =
    babelPresetES2015.buildPreset({}, {modules: false});

// TODO(fks) 09-22-2016: Latest npm type declaration resolves to a non-module
// entity. Upgrade to proper JS import once compatible .d.ts file is released,
// or consider writing a custom declaration in the `custom_typings/` folder.
import File = require('vinyl');

const logger = logging.getLogger('cli.build.optimize-streams');

export type FileCB = (error?: any, file?: File) => void;
export type CSSOptimizeOptions = {
  stripWhitespace?: boolean;
};
export interface OptimizeOptions {
  html?: {minify?: boolean};
  css?: {minify?: boolean};
  js?: {minify?: boolean, compile?: boolean};
}
;

/**
 * GenericOptimizeTransform is a generic optimization stream. It can be extended
 * to create a new kind of specific file-type optimizer, or it can be used
 * directly to create an ad-hoc optimization stream for different libraries.
 * If the transform library throws an exception when run, the file will pass
 * through unaffected.
 */
export class GenericOptimizeTransform extends Transform {
  optimizer: (content: string, options: any) => string;
  optimizerName: string;
  optimizerOptions: any;

  constructor(
      optimizerName: string,
      optimizer: (content: string, optimizerOptions: any) => string,
      optimizerOptions: any) {
    super({objectMode: true});
    this.optimizer = optimizer;
    this.optimizerName = optimizerName;
    this.optimizerOptions = optimizerOptions || {};
  }

  _transform(file: File, _encoding: string, callback: FileCB): void {
    // TODO(fks) 03-07-2017: This is a quick fix to make sure that
    // "webcomponentsjs" files aren't compiled down to ES5, because they contain
    // an important ES6 shim to make custom elements possible. Remove/refactor
    // when we have a better plan for excluding some files from optimization.
    if (!file.path || file.path.indexOf('webcomponentsjs/') >= 0 ||
        file.path.indexOf('webcomponentsjs\\') >= 0) {
      callback(null, file);
      return;
    }

    if (file.contents) {
      try {
        let contents = file.contents.toString();
        contents = this.optimizer(contents, this.optimizerOptions);
        file.contents = new Buffer(contents);
      } catch (error) {
        logger.warn(
            `${this.optimizerName}: Unable to optimize ${file.path}`,
            {err: error.message || error});
      }
    }
    callback(null, file);
  }
}

/**
 * JSBabelTransform uses babel to transpile Javascript, most often rewriting
 * newer ECMAScript features to only use language features available in major
 * browsers. If no options are given to the constructor, JSBabelTransform will
 * use
 * a babel's default "ES6 -> ES5" preset.
 */
class JSBabelTransform extends GenericOptimizeTransform {
  constructor(config: BabelTransformOptions) {
    const transform = (contents: string, options: BabelTransformOptions) => {
      return babelTransform(contents, options).code!;
    };
    super('.js', transform, config);
  }
}

/**
 * A convinient stream that wraps JSBabelTransform in our default "compile"
 * options.
 */
export class JSDefaultCompileTransform extends JSBabelTransform {
  constructor() {
    super({presets: [babelPresetES2015NoModules]});
  }
}

/**
 * A convinient stream that wraps JSBabelTransform in our default "minify"
 * options. Yes, it's strange to use babel for minification, but our minifier
 * babili is actually just a plugin for babel.
 */
export class JSDefaultMinifyTransform extends JSBabelTransform {
  constructor() {
    super({presets: [babiliPreset]});
  }
}

/**
 * CSSMinifyTransform minifies CSS that pass through it (via css-slam).
 */
export class CSSMinifyTransform extends GenericOptimizeTransform {
  constructor(options: CSSOptimizeOptions) {
    super('css-slam', cssSlam.css, options);
  }

  _transform(file: File, encoding: string, callback: FileCB): void {
    // css-slam will only be run if the `stripWhitespace` option is true.
    // Because css-slam itself doesn't accept any options, we handle the
    // option here before transforming.
    if (this.optimizerOptions.stripWhitespace) {
      super._transform(file, encoding, callback);
    }
  }
}

/**
 * InlineCSSOptimizeTransform minifies inlined CSS (found in HTML files) that
 * passes through it (via css-slam).
 */
export class InlineCSSOptimizeTransform extends GenericOptimizeTransform {
  constructor(options: CSSOptimizeOptions) {
    super('css-slam', cssSlam.html, options);
  }

  _transform(file: File, encoding: string, callback: FileCB): void {
    // css-slam will only be run if the `stripWhitespace` option is true.
    // Because css-slam itself doesn't accept any options, we handle the
    // option here before transforming.
    if (this.optimizerOptions.stripWhitespace) {
      super._transform(file, encoding, callback);
    }
  }
}

/**
 * HTMLOptimizeTransform minifies HTML files that pass through it
 * (via html-minifier).
 */
export class HTMLOptimizeTransform extends GenericOptimizeTransform {
  constructor(options: HTMLMinifierOptions) {
    super('html-minify', htmlMinify, options);
  }
}

/**
 * Returns an array of optimization streams to use in your build, based on the
 * OptimizeOptions given.
 */
export function getOptimizeStreams(options?: OptimizeOptions):
    NodeJS.ReadWriteStream[] {
  options = options || {};
  const streams = [];

  // compile ES6 JavaScript using babel
  if (options.js && options.js.compile) {
    streams.push(gulpif(/\.js$/, new JSDefaultCompileTransform()));
  }

  // minify code (minify should always be the last transform)
  if (options.html && options.html.minify) {
    streams.push(gulpif(
        /\.html$/,
        new HTMLOptimizeTransform(
            {collapseWhitespace: true, removeComments: true})));
  }
  if (options.css && options.css.minify) {
    streams.push(
        gulpif(/\.css$/, new CSSMinifyTransform({stripWhitespace: true})));
    // TODO(fks): Remove this InlineCSSOptimizeTransform stream once CSS
    // is properly being isolated by splitHtml() & rejoinHtml().
    streams.push(gulpif(
        /\.html$/, new InlineCSSOptimizeTransform({stripWhitespace: true})));
  }
  if (options.js && options.js.minify) {
    streams.push(gulpif(/\.js$/, new JSDefaultMinifyTransform()));
  }

  return streams;
};