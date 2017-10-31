/*
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

'use strict';

const assert = require('chai').assert;
const path = require('path');
const {fs} = require('mz');
const fsExtra = require('fs-extra');
const tmp = require('tmp');

const runCommand = require('./run-command').runCommand;

const fixturePath = path.join(__dirname, './fixtures/');

tmp.setGracefulCleanup();

suite('polymer build', function() {

  const binPath = path.join(__dirname, '../../bin/polymer.js');

  this.timeout(5 * 1000);

  test('handles a simple correct case', () => {
    const tmpDir = tmp.dirSync();
    copyDir(path.join(fixturePath, 'build-simple', 'source'), tmpDir.name);

    return runCommand(binPath, ['build'], {cwd: tmpDir.name}).then(() => {
      assertDirsEqual(
          path.join(tmpDir.name, 'build'),
          path.join(fixturePath, 'build-simple', 'expected'));
    });
  });

  test('handles a CLI preset', () => {
    const tmpDir = tmp.dirSync();
    copyDir(path.join(fixturePath, 'build-with-preset', 'source'), tmpDir.name);

    return runCommand(binPath, ['build', '--preset', 'es5-bundled'], {
             cwd: tmpDir.name,
           })
        .then(() => {
          assertDirsEqual(
              path.join(tmpDir.name, 'build'),
              path.join(fixturePath, 'build-with-preset', 'expected'));
        });
  });

  test('handles equivalent of the CLI preset', () => {
    const tmpDir = tmp.dirSync();
    copyDir(path.join(fixturePath, 'build-with-preset', 'source'), tmpDir.name);

    return runCommand(
               binPath,
               [
                 'build',
                 '--add-push-manifest',
                 '--add-service-worker',
                 '--bundle',
                 '--css-minify',
                 '--html-minify',
                 '--js-compile',
                 '--js-minify',
               ],
               {
                 cwd: tmpDir.name,
               })
        .then((out) => {
          assertDirsEqual(
              path.join(tmpDir.name, 'build/default'),
              path.join(
                  fixturePath, 'build-with-preset', 'expected/es5-bundled'));
        });
  });

  test('handled (default) bundle all into the entrypoint', () => {
    const tmpDir = tmp.dirSync();
    copyDir(
        path.join(fixturePath, 'fragment-variations', 'source'), tmpDir.name);

    return runCommand(binPath, ['build', '--bundle'], {
             cwd: tmpDir.name,
           })
        .then(
            () => assertDirsEqual(
                path.join(tmpDir.name, 'build/default'),
                path.join(
                    fixturePath,
                    'fragment-variations',
                    'expected-default',
                    'default')));
  });

  test('handled bundle into fragment a', () => {
    const tmpDir = tmp.dirSync();
    copyDir(
        path.join(fixturePath, 'fragment-variations', 'source'), tmpDir.name);

    return runCommand(binPath, ['build', '--bundle', '--fragment', 'a.html'], {
             cwd: tmpDir.name,
           })
        .then(
            () => assertDirsEqual(
                path.join(tmpDir.name, 'build/default'),
                path.join(
                    fixturePath,
                    'fragment-variations',
                    'expected-fragment-a',
                    'default')));
  });

  test('handled bundle into fragment a and b', () => {
    const tmpDir = tmp.dirSync();
    copyDir(
        path.join(fixturePath, 'fragment-variations', 'source'), tmpDir.name);

    return runCommand(
               binPath,
               [
                 'build',
                 '--bundle',
                 '--fragment',
                 'a.html',
                 '--fragment',
                 'b.html',
               ],
               {
                 cwd: tmpDir.name,
               })
        .then(
            () => assertDirsEqual(
                path.join(tmpDir.name, 'build/default'),
                path.join(
                    fixturePath,
                    'fragment-variations',
                    'expected-fragment-b',
                    'default')));
  });

  test('handles polymer 1.x project bundler defaults', () => {
    const tmpDir = tmp.dirSync();
    copyDir(path.join(fixturePath, 'polymer-1-project', 'source'), tmpDir.name);

    return runCommand(
               binPath,
               [
                 'build',
                 '--bundle',
               ],
               {
                 cwd: tmpDir.name,
               })
        .then((out) => {
          assertDirsEqual(
              path.join(tmpDir.name, 'build/default'),
              path.join(fixturePath, 'polymer-1-project', 'expected/default'));
        });
  });

  test('handles polymer 2.x project bundler defaults', () => {
    const tmpDir = tmp.dirSync();
    copyDir(path.join(fixturePath, 'polymer-2-project', 'source'), tmpDir.name);

    return runCommand(
               binPath,
               [
                 'build',
                 '--bundle',
               ],
               {
                 cwd: tmpDir.name,
               })
        .then((out) => {
          assertDirsEqual(
              path.join(tmpDir.name, 'build/default'),
              path.join(fixturePath, 'polymer-2-project', 'expected/default'));
        });
  });
});

function copyDir(fromDir, toDir) {
  fsExtra.copy(fromDir, toDir);
}

function assertDirsEqual(actual, expected, basedir = actual) {
  const actualNames = fs.readdirSync(actual).sort();
  const expectedNames = fs.readdirSync(expected).sort();
  assert.deepEqual(
      actualNames,
      expectedNames,
      `expected files in directory ${path.relative(basedir, actual)}`);
  for (const fn of actualNames) {
    const subActual = path.join(actual, fn);
    const subExpected = path.join(expected, fn);
    const stat = fs.statSync(subActual);
    if (stat.isDirectory()) {
      assertDirsEqual(subActual, subExpected, basedir);
    } else {
      const actualContents = fs.readFileSync(subActual, 'utf-8').trim();
      const expectedContents = fs.readFileSync(subExpected, 'utf-8').trim();
      assert.deepEqual(
          actualContents,
          expectedContents,
          `expected contents of ${path.relative(basedir, subActual)}}`);
    }
  }
}
