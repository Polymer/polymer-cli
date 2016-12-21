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

/**
 * Waits for the given ReadableStream
 */
export function waitFor(stream: NodeJS.ReadableStream):
    Promise<NodeJS.ReadableStream> {
  return new Promise<NodeJS.ReadableStream>((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
  });
}

/**
 * Waits for all the given ReadableStreams
 */
export function waitForAll(streams: NodeJS.ReadableStream[]):
    Promise<NodeJS.ReadableStream[]> {
  return Promise.all<NodeJS.ReadableStream>(streams.map((s) => waitFor(s)));
}

type PipeStream = (NodeJS.ReadableStream|NodeJS.WritableStream|
                   NodeJS.ReadableStream[]|NodeJS.WritableStream[]);

/**
 * pipeStreams() takes in a collection streams and pipes them together,
 * returning the last stream in the pipeline. Each element in the `streams`
 * array must be either a stream, or an array of streams (see PipeStream).
 * pipeStreams() will then flatten this array before piping them all together.
 */
export function pipeStreams(streams: PipeStream[]): NodeJS.ReadableStream {
  return Array.prototype.concat.apply([], streams)
      .reduce((a: NodeJS.ReadableStream, b: NodeJS.ReadWriteStream) => {
        return a.pipe(b);
      });
}
