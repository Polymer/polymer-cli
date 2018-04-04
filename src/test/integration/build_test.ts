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

import {assert} from 'chai';
import * as path from 'path';
import {fs} from 'mz';
import * as fsExtra from 'fs-extra';
import * as tmp from 'tmp';
import {runCommand} from './run-command';

const fixturePath =
    path.join(__dirname, '../../../src/test/integration/fixtures/');

tmp.setGracefulCleanup();

suite('polymer build', function() {
  const binPath = path.join(__dirname, '../../../bin/polymer.js');

  this.timeout(5 * 1000);

  test('handles a simple correct case', async () => {
    const tmpDir = tmp.dirSync();
    copyDir(path.join(fixturePath, 'build-simple', 'source'), tmpDir.name);

    await runCommand(binPath, ['build'], {cwd: tmpDir.name});
    assertDirsEqual(
        path.join(tmpDir.name, 'build'),
        path.join(fixturePath, 'build-simple', 'expected'));
  });

  test('handles a CLI preset', async () => {
    const tmpDir = tmp.dirSync();
    copyDir(path.join(fixturePath, 'build-with-preset', 'source'), tmpDir.name);

    await runCommand(binPath, ['build', '--preset', 'es5-bundled'], {
      cwd: tmpDir.name,
    });
    assertDirsEqual(
        path.join(tmpDir.name, 'build'),
        path.join(fixturePath, 'build-with-preset', 'expected'));
  });

  test('handles equivalent of the CLI preset', async () => {
    const tmpDir = tmp.dirSync();
    copyDir(path.join(fixturePath, 'build-with-preset', 'source'), tmpDir.name);

    await runCommand(
        binPath,
        [
          'build',
          '--add-service-worker',
          '--bundle',
          '--css-minify',
          '--html-minify',
          '--js-compile',
          '--js-minify'
        ],
        {cwd: tmpDir.name});
    assertDirsEqual(
        path.join(tmpDir.name, 'build/default'),
        path.join(fixturePath, 'build-with-preset', 'expected/es5-bundled'));
  });

  test('handled (default) bundle all into the entrypoint', async () => {
    const tmpDir = tmp.dirSync();
    copyDir(
        path.join(fixturePath, 'fragment-variations', 'source'), tmpDir.name);

    await runCommand(binPath, ['build', '--bundle'], {
      cwd: tmpDir.name,
    });
    assertDirsEqual(
        path.join(tmpDir.name, 'build/default'),
        path.join(
            fixturePath, 'fragment-variations', 'expected-default', 'default'));
  });

  test('handled bundle into fragment a', async () => {
    const tmpDir = tmp.dirSync();
    copyDir(
        path.join(fixturePath, 'fragment-variations', 'source'), tmpDir.name);

    await runCommand(binPath, ['build', '--bundle', '--fragment', 'a.html'], {
      cwd: tmpDir.name,
    });
    assertDirsEqual(
        path.join(tmpDir.name, 'build/default'),
        path.join(
            fixturePath,
            'fragment-variations',
            'expected-fragment-a',
            'default'));
  });

  test('handled bundle into fragment a and b', async () => {
    const tmpDir = tmp.dirSync();
    copyDir(
        path.join(fixturePath, 'fragment-variations', 'source'), tmpDir.name);

    await runCommand(
        binPath,
        ['build', '--bundle', '--fragment', 'a.html', '--fragment', 'b.html'],
        {cwd: tmpDir.name});

    assertDirsEqual(
        path.join(tmpDir.name, 'build/default'),
        path.join(
            fixturePath,
            'fragment-variations',
            'expected-fragment-b',
            'default'));
  });

  test('handles polymer 1.x project bundler defaults', async () => {
    const tmpDir = tmp.dirSync();
    copyDir(path.join(fixturePath, 'polymer-1-project', 'source'), tmpDir.name);

    await runCommand(binPath, ['build', '--bundle'], {cwd: tmpDir.name});

    assertDirsEqual(
        path.join(tmpDir.name, 'build/default'),
        path.join(fixturePath, 'polymer-1-project', 'expected/default'));
  });

  test('handles polymer 2.x project bundler defaults', async () => {
    const tmpDir = tmp.dirSync();
    copyDir(path.join(fixturePath, 'polymer-2-project', 'source'), tmpDir.name);

    await runCommand(binPath, ['build', '--bundle'], {cwd: tmpDir.name});
    assertDirsEqual(
        path.join(tmpDir.name, 'build/default'),
        path.join(fixturePath, 'polymer-2-project', 'expected/default'));
  });

  test('handles bundle tagged-template literals in ES5', async () => {
    const tmpDir = tmp.dirSync();
    copyDir(
        path.join(fixturePath, 'build-with-tagged-template-literals', 'source'),
        tmpDir.name);

    await runCommand(binPath, ['build'], {
      cwd: tmpDir.name,
    });

    const filename =
        path.join(tmpDir.name, 'build', 'es5-bundled', 'my-app.html');
    const contents = fs.readFileSync(filename, 'utf-8');
    // assert contents contain _templateObject with UUID suffix
    assert.match(
        contents,
        /_templateObject\d*_[A-Fa-f0-9]+\s*=/g,
        'build output does not contain modified _templateObject names');
    // assert contents don't contain unmodified "_templateObject" variable
    assert.notMatch(
        contents,
        /_templateObject\d*\s*=/g,
        'build output contains unmodified _templateObject names');
  });

  test('--npm finds dependencies in "node_modules/"', async () => {
    const tmpDir = tmp.dirSync();
    copyDir(path.join(fixturePath, 'element-with-npm-deps'), tmpDir.name);

    await runCommand(binPath, ['build', '--npm'], {cwd: tmpDir.name});
  });

  const testName =
      '--components-dir finds dependencies in the specified directory';
  test.skip(testName, async () => {
    const tmpDir = tmp.dirSync();
    copyDir(path.join(fixturePath, 'element-with-other-deps'), tmpDir.name);

    await runCommand(binPath, ['build', '--component-dir=path/to/deps/'], {
      cwd: tmpDir.name
    });
  });

  test('module-based project builds with various configs', async () => {
    const tmpDir = tmp.dirSync();
    copyDir(path.join(fixturePath, 'build-modules', 'source'), tmpDir.name);

    await runCommand(binPath, ['build'], {cwd: tmpDir.name});
    assertDirsEqual(
        path.join(tmpDir.name, 'build'),
        path.join(fixturePath, 'build-modules', 'expected'));
  });
});

function copyDir(fromDir: string, toDir: string) {
  fsExtra.copy(fromDir, toDir);
}

function assertDirsEqual(actual: string, expected: string, basedir = actual) {
  // uncomment to update the golden:
  // fsExtra.emptyDirSync(expected);
  // fsExtra.copySync(actual, expected);

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
          `expected contents of ${path.relative(basedir, subActual)}`);
    }
  }
}
