/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {Transform} from 'stream';
import File = require('vinyl');
import * as uglify from 'uglify-js';

const UglifyOptions: uglify.MinifyOptions = {fromString: true};

export class UglifyStream extends Transform {

  constructor() {
    super({objectMode: true});
  }

  _transform(file: File, encoding: string, callback:(error?, data?) => void): void {
    if (file.contents && file.path.endsWith('.js')) {
      try {
        let contents = String(file.contents);
        contents = uglify.minify(contents, UglifyOptions).code;
        file.contents = new Buffer(contents);
        callback(null, file);
      } catch (err) {
        console.log(file.path);
        console.error(err.stack);
        callback(err);
      }
    }
  }
};
