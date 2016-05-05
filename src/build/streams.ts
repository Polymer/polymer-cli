/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {PassThrough, Readable, Transform} from 'stream';

const multipipe = require('multipipe');

/**
 * Waits for the given ReadableStream
 */
export function waitFor(stream: NodeJS.ReadableStream): Promise<NodeJS.ReadableStream> {
  return new Promise<NodeJS.ReadableStream>((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
  });
}

/**
 * Waits for all the given ReadableStreams
 */
export function waitForAll(streams: NodeJS.ReadableStream[]): Promise<NodeJS.ReadableStream[]> {
  return Promise.all<NodeJS.ReadableStream>(streams.map((s) => waitFor(s)));
}

/**
 * Composes multiple streams (or Transforms) into one.
 */
export function compose(streams: NodeJS.ReadWriteStream[]) {
  if (streams && streams.length > 0) {
    return multipipe(streams);
  } else {
    return new PassThrough({objectMode: true});
  }
}

/**
 * Forks a stream of Vinyl files, cloning each file before emitting on the fork.
 */
export class ForkedVinylStream extends Readable {

  input: NodeJS.ReadableStream;

  constructor(input: NodeJS.ReadableStream) {
    super({objectMode: true});
    this.input = input;
    input.on('data', (file) => {
      this.push(file.clone({deep: true, contents: true}));
    });
    input.on('end', () => {
      this.emit('end');
    });
    input.on('error', (e) => {
      this.emit('error', e);
    });
  }

  _read(size: number) {
    // apparently no-op is fine, but this method is required,
    // see: https://nodejs.org/api/stream.html#stream_readable_read_size_1
  }
}
