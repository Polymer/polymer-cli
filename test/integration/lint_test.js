/*
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

'use strict';

const fs = require('fs');
const os = require('os');
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

suite.only('polymer lint', function () {

  const binPath = path.join(__dirname, '../../bin/polymer.js');

  this.timeout(2 * 1000);

  test('handles a simple correct case', () => {
    const cwd = path.join(fixturePath, 'lint-simple');
    return runCommand(binPath, ['lint'], { cwd });
  });

  test('fails when rules are not specified', () => {
    const cwd = path.join(fixturePath, 'lint-no-polymer-json');
    const result =
      runCommand(binPath, ['lint'], { cwd, failureExpected: true });
    return invertPromise(result);
  });

  test('takes rules from the command line', () => {
    const cwd = path.join(fixturePath, 'lint-no-polymer-json');
    return runCommand(binPath, ['lint', '--rules=polymer-2-hybrid'], { cwd });
  });

  test('fails when lint errors are found', () => {
    const cwd = path.join(fixturePath, 'lint-with-error');
    const result =
        runCommand(binPath, ['lint'], { cwd, failureExpected: true });
    return invertPromise(result).then((output) => {
      assert.include(
        output, '<style> tags should not be direct children of <dom-module>');
    });
  });

  test('applies fixes to a package when requested', () => {
    const fixtureDir = path.join(fixturePath, 'lint-fixes');
    const cwd = getTempCopy(fixtureDir);
    const result = runCommand(binPath, ['lint', '--fix'], { cwd });
    return result.then((output) => {
      assert.deepEqual(fs.readFileSync(path.join(cwd, 'toplevel-bad.html'), 'utf-8'),
        `<style>
  div {
    @apply --foo;
  }
</style>
`);

      assert.deepEqual(fs.readFileSync(path.join(cwd, 'subdir', 'nested-bad.html'), 'utf-8'), `<style>
  div {
    @apply --bar;
  }
</style>
`)

      assert.include(output, 'Made 2 changes to toplevel-bad.html');
      assert.include(output, 'Made 2 changes to subdir/nested-bad.html');
      assert.include(output, 'Fixed 2 warnings.');
    });
  });

  test('applies fixes to a specific file when requested', () => {
    const fixtureDir = path.join(fixturePath, 'lint-fixes');
    const cwd = getTempCopy(fixtureDir);
    const result = runCommand(binPath, ['lint', '--fix', '-i', 'toplevel-bad.html'], { cwd });
    return result.then((output) => {
      assert.deepEqual(fs.readFileSync(path.join(cwd, 'toplevel-bad.html'), 'utf-8'),
        `<style>
  div {
    @apply --foo;
  }
</style>
`);

      assert.deepEqual(fs.readFileSync(path.join(cwd, 'subdir', 'nested-bad.html'), 'utf-8'), `<style>
  div {
    @apply(--bar);
  }
</style>
`);

      assert.include(output, 'Made 2 changes to toplevel-bad.html');
      assert.include(output, 'Fixed 1 warning.');
    });
  });
});

/**
 * @param {string} fromDir
 */
function getTempCopy(fromDir) {
  const toDir = fs.mkdtempSync(path.join(os.tmpdir(), path.basename(fromDir)));
  copyDir(fromDir, toDir);
  return toDir;
}

/**
 * @param {string} from
 * @param {string} to
 */
function copyDir(fromDir, toDir) {
  for (const inner of fs.readdirSync(fromDir)) {
    const fromInner = path.join(fromDir, inner);
    const toInner = path.join(toDir, inner);
    const stat = fs.statSync(fromInner);
    if (stat.isDirectory()) {
      fs.mkdirSync(toInner);
      copyDir(fromInner, toInner);
    } else {

      fs.writeFileSync(toInner, fs.readFileSync(fromInner));
    }
  }
}
