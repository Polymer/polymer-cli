/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
import * as stream from 'stream';
import File = require('vinyl');

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

// NOTE: this broke tar-fs streams, don't know why
export class StreamLogger extends stream.Transform {
  prefix: string;
  constructor(prefix: string) {
    super();
    this.prefix = prefix || '';
  }
  _transform(buffer: Buffer, encoding: string, callback: (error?, data?) => void): void {
    console.log(this.prefix, buffer.toString('base64'));
  }
}
