/*
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

'use strict';

const path = require('path');
const childProcess = require('child_process');

/**
 * Run the given command as a forked child process, and return a promise
 * which will reject/resolve with the result of the command.
 *
 * If the command succeeds the promise will be resolved with the stdout+stderr
 * of the command, as a string.
 */
function runCommand(path, args, options) {
  let contents;
  return new Promise((resolve, reject) => {
    let commandError;
    options.silent = true;
    const forkedProcess = childProcess.fork(path, args, options);
    contents = pipesToString(forkedProcess.stdout, forkedProcess.stderr);

    // listen for errors as they may prevent the exit event from firing
    forkedProcess.on('error', (error) => { commandError = error });
    // execute the callback once the forkedProcess has finished running
    forkedProcess.on('exit', (code) => {
      if (commandError) {
        reject(commandError);
        return;
      }
      if (code !== 0) {
        reject(new Error(
          `Error running ${path} with args ${args}. Got exit code: ${code}`));
        return;
      }
      resolve(contents);
    });
  }).catch((err) => {
    // If the command was successful there's no need to print anything to the
    // console, but if it failed then its output is probably helpful.
    // Print out the output, then reject the final result with the original
    // error.
    return contents.then((out) => {
      if (!options.failureExpected) {
        console.log(`Output of failed command 'node ${path} ${args.join(' ')}' in directory ${options.cwd}`);
        console.log(out);
        throw err;
      } else {
        throw out;
      }
    });
  });
}

/**
 * Reads the two streams and produces a promise of their combined output as a
 * string.
 *
 * @param {NodeJS.ReadableStream} stdout
 * @param {NodeJS.ReadableStream} stderr
 * @return {Promise<string>}
 */
function pipesToString(stdout, stderr) {
  let string = ''
  const promises = [];
  for (const stream of [stdout, stderr]) {
    stream.setEncoding('utf8');
    stream.on('data', function(chunk) {
      string += chunk;
    });

    promises.push(new Promise((resolve) => {
      stream.on('end', resolve);
    }));
  }

  return Promise.all(promises).then(() => {
    return string;
  });
}

module.exports = {
  runCommand,
};
