/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import File = require('vinyl')
import * as stream from 'stream';
import {UglifyTransform} from './uglify-stream';
import * as gulpif from 'gulp-if';
import * as minimatch from 'minimatch';

export class Logger extends stream.Transform {
  prefix: String;
  constructor(prefix: string) {
    super({objectMode: true});
    this.prefix = prefix || '';
  }
  _transform(file: File, encoding: string, callback: (error?, data?) => void): void {
    console.log(this.prefix, file.path);
    callback(null, file);
  }
}

export function optimizePipe(stream: stream.Stream) {
  return stream.pipe(new Logger('optimize'))
    .pipe(new UglifyTransform())
}
