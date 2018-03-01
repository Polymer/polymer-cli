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
import * as fse from 'fs-extra';
import * as tmp from 'tmp';
import {runCommand} from './run-command';

const fixtureRoot =
    path.join(__dirname, '../../../src/test/integration/fixtures/');

tmp.setGracefulCleanup();

suite('polymer build', function() {
  const binPath = path.join(__dirname, '../../../bin/polymer.js');

  this.timeout(5 * 1000);

  test('handles a simple correct case', async () => {
    const tmpDir = tmp.dirSync();
    await fse.copy(
        path.join(fixtureRoot, 'build-simple', 'source'), tmpDir.name);

    await runCommand(binPath, ['build'], {cwd: tmpDir.name});
    assertDirsEqual(
        path.join(tmpDir.name, 'build'),
        path.join(fixtureRoot, 'build-simple', 'expected'));
  });

  test('handles a CLI preset', async () => {
    const tmpDir = tmp.dirSync();
    await fse.copy(
        path.join(fixtureRoot, 'build-with-preset', 'source'), tmpDir.name);

    await runCommand(binPath, ['build', '--preset', 'es5-bundled'], {
      cwd: tmpDir.name,
    });
    assertDirsEqual(
        path.join(tmpDir.name, 'build'),
        path.join(fixtureRoot, 'build-with-preset', 'expected'));
  });

  test('handles equivalent of the CLI preset', async () => {
    const tmpDir = tmp.dirSync();
    await fse.copy(
        path.join(fixtureRoot, 'build-with-preset', 'source'), tmpDir.name);

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
        path.join(fixtureRoot, 'build-with-preset', 'expected/es5-bundled'));
  });

  test('handled (default) bundle all into the entrypoint', async () => {
    const tmpDir = tmp.dirSync();
    await fse.copy(
        path.join(fixtureRoot, 'fragment-variations', 'source'), tmpDir.name);

    await runCommand(binPath, ['build', '--bundle'], {
      cwd: tmpDir.name,
    });
    assertDirsEqual(
        path.join(tmpDir.name, 'build/default'),
        path.join(
            fixtureRoot, 'fragment-variations', 'expected-default', 'default'));
  });

  test('handled bundle into fragment a', async () => {
    const tmpDir = tmp.dirSync();
    await fse.copy(
        path.join(fixtureRoot, 'fragment-variations', 'source'), tmpDir.name);

    await runCommand(binPath, ['build', '--bundle', '--fragment', 'a.html'], {
      cwd: tmpDir.name,
    });
    assertDirsEqual(
        path.join(tmpDir.name, 'build/default'),
        path.join(
            fixtureRoot,
            'fragment-variations',
            'expected-fragment-a',
            'default'));
  });

  test('handled bundle into fragment a and b', async () => {
    const tmpDir = tmp.dirSync();
    await fse.copy(
        path.join(fixtureRoot, 'fragment-variations', 'source'), tmpDir.name);

    await runCommand(
        binPath,
        ['build', '--bundle', '--fragment', 'a.html', '--fragment', 'b.html'],
        {cwd: tmpDir.name});

    assertDirsEqual(
        path.join(tmpDir.name, 'build/default'),
        path.join(
            fixtureRoot,
            'fragment-variations',
            'expected-fragment-b',
            'default'));
  });

  test('handles polymer 1.x project bundler defaults', async () => {
    const tmpDir = tmp.dirSync();
    await fse.copy(
        path.join(fixtureRoot, 'polymer-1-project', 'source'), tmpDir.name);

    await runCommand(binPath, ['build', '--bundle'], {cwd: tmpDir.name});

    assertDirsEqual(
        path.join(tmpDir.name, 'build/default'),
        path.join(fixtureRoot, 'polymer-1-project', 'expected/default'));
  });

  test('handles polymer 2.x project bundler defaults', async () => {
    const tmpDir = tmp.dirSync();
    await fse.copy(
        path.join(fixtureRoot, 'polymer-2-project', 'source'), tmpDir.name);

    await runCommand(binPath, ['build', '--bundle'], {cwd: tmpDir.name});
    assertDirsEqual(
        path.join(tmpDir.name, 'build/default'),
        path.join(fixtureRoot, 'polymer-2-project', 'expected/default'));
  });

  test('--npm finds dependencies in "node_modules/"', async () => {
    const tmpDir = tmp.dirSync();
    await fse.copy(
        path.join(fixtureRoot, 'element-with-npm-deps'), tmpDir.name);

    await runCommand(binPath, ['build', '--npm'], {cwd: tmpDir.name});
  });

  test(
      '--components-dir finds dependencies in the specified directory',
      async () => {
        const tmpDir = tmp.dirSync();
        await fse.copy(
            path.join(fixtureRoot, 'element-with-other-deps'), tmpDir.name);

        await runCommand(binPath, ['build', '--component-dir=path/to/deps/'], {
          cwd: tmpDir.name
        });
      });

  test('compiles modules', async () => {
    const tmpDir = tmp.dirSync().name
    const fixtureDir = path.join(fixtureRoot, 'build-modules');
    await fse.copy(path.join(fixtureDir, 'source'), tmpDir);

    await runCommand(binPath, ['build'], {cwd: tmpDir});
    assertDirsEqual(
        path.join(tmpDir, 'build'), path.join(fixtureDir, 'expected'));
  });
});

function assertDirsEqual(actual: string, expected: string, basedir = actual) {
  const actualNames = fse.readdirSync(actual).sort();
  const expectedNames = fse.readdirSync(expected).sort();
  assert.deepEqual(
      actualNames,
      expectedNames,
      `expected files in directory ${path.relative(basedir, actual)}`);
  for (const fn of actualNames) {
    const subActual = path.join(actual, fn);
    const subExpected = path.join(expected, fn);
    const stat = fse.statSync(subActual);
    if (stat.isDirectory()) {
      assertDirsEqual(subActual, subExpected, basedir);
    } else {
      const actualContents = fse.readFileSync(subActual, 'utf-8').trim();
      const expectedContents = fse.readFileSync(subExpected, 'utf-8').trim();
      assert.deepEqual(
          actualContents,
          expectedContents,
          `expected contents of ${path.relative(basedir, subActual)}`);
    }
  }
}
