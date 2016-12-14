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

import * as cssSlam from 'css-slam';
import {minify as htmlMinify, Options as HTMLMinifierOptions} from 'html-minifier';
import * as logging from 'plylog';
import {Transform} from 'stream';
import {minify as uglify, MinifyOptions as UglifyOptions} from 'uglify-js';


// TODO(fks) 09-22-2016: Latest npm type declaration resolves to a non-module
// entity. Upgrade to proper JS import once compatible .d.ts file is released,
// or consider writing a custom declaration in the `custom_typings/` folder.
import File = require('vinyl');

let logger = logging.getLogger('cli.build.optimize-streams');

export type FileCB = (error?: any, file?: File) => void;
export type CSSOptimizeOptions = {
  stripWhitespace?: boolean;
};

/**
 * GenericOptimizeStream is a generic optimization stream. It can be extended
 * to create a new kind of specific file-type optimizer, or it can be used
 * directly to create an ad-hoc optimization stream for different libraries.
 * If the transform library throws an exception when run, the file will pass
 * through unaffected.
 */
export class GenericOptimizeStream extends Transform {
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
 * JSOptimizeStream optimizes JS files that pass through it (via uglify).
 */
export class JSOptimizeStream extends GenericOptimizeStream {
  constructor(options: UglifyOptions) {
    // uglify is special, in that it returns an object with a code property
    // instead of just a code string. We create a compliant optimizer here
    // that returns a string instead.
    let uglifyOptimizer = (contents: string, options: UglifyOptions) => {
      return uglify(contents, options).code;
    };
    // We automatically add the fromString option because it is required.
    let uglifyOptions = Object.assign({fromString: true}, options);
    super('uglify-js', uglifyOptimizer, uglifyOptions);
  }
}

/**
 * CSSOptimizeStream optimizes CSS that pass through it (via css-slam).
 */
export class CSSOptimizeStream extends GenericOptimizeStream {
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
 * InlineCSSOptimizeStream optimizes inlined CSS (found in HTML files) that
 * passes through it (via css-slam).
 */
export class InlineCSSOptimizeStream extends GenericOptimizeStream {
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
 * HTMLOptimizeStream optimizes HTML files that pass through it
 * (via html-minifier).
 */
export class HTMLOptimizeStream extends GenericOptimizeStream {
  constructor(options: HTMLMinifierOptions) {
    super('html-minify', htmlMinify, options);
  }
}
