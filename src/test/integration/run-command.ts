/*
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

import * as childProcess from 'child_process';

export interface Options extends childProcess.ForkOptions {
  failureExpected?: boolean;
}

/**
 * Run the given command as a forked child process, and return a promise
 * which will reject/resolve with the result of the command.
 *
 * If the command succeeds the promise will be resolved with the stdout+stderr
 * of the command, as a string.
 *
 */
export async function runCommand(
    path: string, args: string[], options: Options): Promise<string> {
  let commandError: Error|undefined = undefined;
  options.silent = true;
  const forkedProcess = childProcess.fork(path, args, options);
  const outputPromise =
      pipesToString(forkedProcess.stdout, forkedProcess.stderr);
  // listen for errors as they may prevent the exit event from firing
  forkedProcess.on('error', (error) => {
    commandError = error;
  });
  const exitCode = await new Promise<number>((resolve) => {
    forkedProcess.on('exit', resolve);
  });
  if (exitCode !== 0) {
    commandError = new Error(
        `Error running ${path} with args ${args}. ` +
        `Got exit code: ${exitCode}`);
  }
  if (!commandError) {
    return outputPromise;
  }

  // If the command was successful there's no need to print anything to
  // the console, but if it failed then its output is probably helpful.
  // Print out the output, then reject the final result with the original
  // error.
  const out = await outputPromise;
  if (options.failureExpected) {
    // Throw the output string as our error if failure is expected.
    throw out;
  };

  console.log(
      `Output of failed command 'node ${path} ${args.join(' ')}' ` +
      `in directory ${options.cwd}`);
  console.log(out);
  throw commandError;
}

/**
 * Reads the two streams and produces a promise of their combined output as a
 * string.
 */
async function pipesToString(
    stdout: NodeJS.ReadableStream, stderr: NodeJS.ReadableStream) {
  let str = '';
  const promises = [];
  for (const stream of [stdout, stderr]) {
    stream.setEncoding('utf8');
    stream.on('data', function(chunk: string) {
      str += chunk;
    });

    promises.push(new Promise((resolve) => {
      stream.on('end', resolve);
    }));
  }

  await Promise.all(promises);
  return str;
}
