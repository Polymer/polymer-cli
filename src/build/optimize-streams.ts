import {minify as uglify, MinifyOptions as UglifyOptions} from 'uglify-js';
import {css as cssSlam} from 'css-slam';
import {minify as htmlMinify, Options as HTMLMinifierOptions} from 'html-minifier';
import {transform as babelTransform} from 'babel-core';
import {Transform} from 'stream';
import * as logging from 'plylog';

// TODO(fks) 09-22-2016: Latest npm type declaration resolves to a non-module
// entity. Upgrade to proper JS import once compatible .d.ts file is released,
// or consider writing a custom declaration in the `custom_typings/` folder.
import File = require('vinyl');

let logger = logging.getLogger('cli.build.optimize-streams');

export type FileCB = (error?: any, file?: File) => void;
export type CSSOptimizeOptions = {
  stripWhitespace?: boolean;
}

/**
 * GenericOptimizeStream is a generic optimization stream. It can be extended
 * to create a new kind of specific file-type optimizer, or it can be used
 * directly to create an ad-hoc optimization stream for certain types of files.
 */
export class GenericOptimizeStream extends Transform {

  validExtension: string;
  optimizer: (content: string, options: any) => string;
  optimizerOptions: any;

  constructor(
      validExtension: string,
      optimizer: (content: string, optimizerOptions: any) => string,
      optimizerOptions: any) {
    super({objectMode: true});
    this.optimizer = optimizer;
    this.validExtension = validExtension;
    this.optimizerOptions = optimizerOptions || {};
  }

  _transform(file: File, _encoding: string, callback: FileCB): void {
    if (file.contents && file.path.endsWith(`${this.validExtension}`)) {
      try {
        let contents = file.contents.toString();
        contents = this.optimizer(contents, this.optimizerOptions);
        file.contents = new Buffer(contents);
      } catch (error) {
        logger.warn(
          `Unable to optimize ${this.validExtension} file ${file.path}`,
          {err: error.message}
        );
      }
    }
    callback(null, file);
  }

}

/**
 * JSOptimizeStream optimizes JS files that pass through it (via uglify).
 * If a file is not a `.js` file or if uglify throws an exception when run,
 * the file will pass through unaffected.
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
    super('.js', uglifyOptimizer, uglifyOptions);
  }

}


export class JSBabelStream extends Transform {

  optimizerOptions: any;

  constructor(optimizerOptions: any) {
    super({objectMode: true});
    this.optimizerOptions = optimizerOptions || {};
  }

  _transform(file: File, _encoding: string, callback: FileCB): void {
    if (file.contents && file.path.endsWith(`.js`)) {
      try {
        let contents = file.contents.toString();
        console.log(this.optimizerOptions);
        contents = babelTransform(contents, this.optimizerOptions).code;
        file.contents = new Buffer(contents);
      } catch (error) {
        logger.warn(
          `Unable to babelify file ${file.path}`,
          {err: error.message}
        );
      }
    }
    callback(null, file);
  }

}



/**
 * CSSOptimizeStream optimizes CSS files that pass through it (via css-slam).
 * If a file is not a `.css` file or if css-slam throws an exception when run,
 * the file will pass through unaffected.
 */
export class CSSOptimizeStream extends GenericOptimizeStream {

  constructor(options: CSSOptimizeOptions) {
    super('.css', cssSlam, options);
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
 * (via html-minifier). If a file is not a `.html` file or if html-minifier
 * throws an exception when run, the file will pass through unaffected.
 */
export class HTMLOptimizeStream extends GenericOptimizeStream {

  constructor(options: HTMLMinifierOptions) {
    super('.html', htmlMinify, options);
  }

}
