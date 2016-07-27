import {minify as uglify, MinifyOptions as UglifyOptions} from 'uglify-js';
import {css as cssSlam} from 'css-slam';
import {minify as htmlMinify, Options as HTMLMinifierOptions} from 'html-minifier';
import {Transform} from 'stream';
import * as logging from 'plylog';
import File = require('vinyl');

let logger = logging.getLogger('cli.build.optimize-streams');

export type FileCB = (error?: any, file?: File) => void;
export type CSSOptimizeOptions = {
  stripWhitespace?: boolean;
}

/**
 * JSOptimizeStream optimizes JS files that pass through it (via uglify).
 * If a file is not a `.js` file or if uglify throws an exception when run,
 * the file will pass through unaffected.
 */
export class JSOptimizeStream extends Transform {

  options: UglifyOptions;

  constructor(options: UglifyOptions) {
    super({objectMode: true});
    // NOTE: We automatically add the fromString option because it is required.
    this.options = Object.assign({fromString: true}, options);
  }

  _transform(file: File, encoding: string, callback: FileCB): void {
    if (file.contents && file.path.endsWith('.js')) {
      try {
        let contents = file.contents.toString();
        contents = uglify(contents, this.options).code;
        file.contents = new Buffer(contents);
      } catch (err) {
        logger.warn(`Unable to uglify js file ${file.path}`, {err});
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
export class CSSOptimizeStream extends Transform {

  options: CSSOptimizeOptions;

  constructor(options: CSSOptimizeOptions) {
    super({objectMode: true});
    this.options = options || {};
  }

  _transform(file: File, encoding: string, callback: FileCB): void {
    // css-slam will only be run if the `stripWhitespace` option is true.
    // Because css-slam itself doesn't accept any options, we handle the
    // options here in the stream.
    if (this.options.stripWhitespace && file.contents
        && file.path.endsWith('.css')) {
      try {
        let contents = file.contents.toString();
        contents = cssSlam(contents);
        file.contents = new Buffer(contents);
      } catch (err) {
        logger.warn(`Unable to optimize css file ${file.path}`, {err});
      }
    }
    callback(null, file);
  }

}


/**
 * HTMLOptimizeStream optimizes HTML files that pass through it
 * (via html-minifier). If a file is not a `.html` file or if html-minifier
 * throws an exception when run, the file will pass through unaffected.
 */
export class HTMLOptimizeStream extends Transform {

  options: HTMLMinifierOptions;

  constructor(options: HTMLMinifierOptions) {
    super({objectMode: true});
    this.options = options || {};
  }

  _transform(file: File, encoding: string, callback: FileCB): void {
    if (file.contents && file.path.endsWith('.html')) {
      try {
        let contents = file.contents.toString();
        contents = htmlMinify(contents, this.options);
        file.contents = new Buffer(contents);
      } catch (err) {
        logger.warn(`Unable to minify html file ${file.path}`, {err});
      }
    }
    callback(null, file);
  }

}
