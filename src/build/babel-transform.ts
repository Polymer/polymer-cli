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
import * as logging from 'plylog';

import File = require('vinyl');

const requireg = require('requireg');
const logger = logging.getLogger('js.compile');

type FileCB = (error?: any, file?: File) => void;

export class BabelTransform extends Transform {

  _babel: any;
  _preset: any;

  constructor() {
    super({objectMode: true});
    try {
      this._babel = requireg('babel-core');
    } catch (e) {
      logger.error(`${e.message}\nDid you install babel-core? Run \`npm i -g babel-core\``);
    }
    try {
      this._preset = requireg('babel-preset-es2015');
    } catch (e) {
      logger.error(`${e.message}\nDid you install babel-preset-es2015? Run \`npm i -g babel-preset-es2015\``);
    }
  }

  _transform(file: File, _encoding: string, _callback: FileCB): void {
    logger.debug(`compiling ${file.path}`);
    const options = {
      filename: file.path,
      filenameRelative: file.relative,
      presets: [this._preset],
    };
    try {
      const result = this._babel.transform(file.contents.toString(), options);
      if (!result.ignored) {
        file.contents = new Buffer(result.code as string);
        _callback(null, file);
      }
    } catch (error) {
      logger.error(error.message);
      _callback(error, null);
    }
  }
}
