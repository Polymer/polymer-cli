/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

export async function invertPromise(p: Promise<any>): Promise<any> {
  let result;
  try {
    result = await p;
  } catch (e) {
    return e;
  }
  throw new Error(`Expected an error, got ${result}`);
}

/**
 * Call to begin capturing all output. Call the returned function to
 * stop capturing output and get the contents as a string.
 *
 * Captures output from console.log and friends. Does not capture plylog, which
 * doesn't seem to be very easy to intercept.
 */
export async function interceptOutput(captured: () => Promise<void>):
    Promise<string> {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const buffer: string[] = [];
  const capture = (...args: any[]) => {
    buffer.push(args.join(' '));
  };
  console.log = capture;
  console.error = capture;
  console.warn = capture;
  const restoreAndGetOutput = () => {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
    return buffer.join('\n');
  };
  try {
    await captured();
  } catch (err) {
    const output = restoreAndGetOutput();
    console.error(output);
    throw err;
  }

  return restoreAndGetOutput();
}
