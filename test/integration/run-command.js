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
 */
function runCommand(path, args, options) {
  return new Promise((resolve, reject) => {
    let commandError;
    const forkedProcess = childProcess.fork(path, args, options);

    // listen for errors as they may prevent the exit event from firing
    forkedProcess.on('error', (error) => { commandError = error });
    // execute the callback once the forkedProcess has finished running
    forkedProcess.on('exit', (code) => {
      if (commandError) {
        reject(commandError);
        return;
      }
      if (code !== 0) {
        reject(new Error('exit code: ' + code));
        return;
      }
      resolve();
    });
  });
}

module.exports = {
  runCommand,
};
