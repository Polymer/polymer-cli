/*
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

'use strict';

const assert = require('chai').assert;
const path = require('path');

const runCommand = require('./run-command').runCommand;

const fixturePath = path.join(__dirname, './fixtures/');

function invertPromise(p) {
  return p.then((v) => {
    throw new Error(
        `Expected promise to reject. Instead it resolved with ${v}`);
  }, (err) => err);
}

suite('polymer lint', function() {

  const binPath = path.join(__dirname, '../../bin/polymer.js');

  this.timeout(2 * 1000);

  test('handles a simple correct case', () => {
    const cwd = path.join(fixturePath, 'lint-simple');
    return runCommand(binPath, ['experimental-lint'], {cwd});
  });

  test('fails when rules are not specified', () => {
    const cwd = path.join(fixturePath, 'lint-no-polymer-json');
    const result = runCommand(
        binPath, ['experimental-lint'], { cwd, failureExpected: true });
    return invertPromise(result);
  });

  test('takes rules from the command line', () => {
    const cwd = path.join(fixturePath, 'lint-no-polymer-json');
    return runCommand(binPath, ['experimental-lint', '--rules=polymer-2-hybrid'], {cwd});
  });

  test('fails when lint errors are found', () => {
    const cwd = path.join(fixturePath, 'lint-with-error');
    const result = runCommand(binPath, ['experimental-lint'], {cwd, failureExpected: true});
    return invertPromise(result).then((output) => {
      assert.include(
          output, '<style> tags should not be direct children of <dom-module>');
    });
  });

});
