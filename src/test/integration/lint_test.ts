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

import * as fs from 'fs';
import * as os from 'os';
import {assert} from 'chai';
import * as path from 'path';
import {runCommand} from './run-command';
import {invertPromise} from '../util';

const fixturePath =
    path.join(__dirname, '../../../src/test/integration/fixtures/');

suite('polymer lint', function() {

  const binPath = path.join(__dirname, '../../../bin/polymer.js');

  this.timeout(2 * 1000);

  test('handles a simple correct case', async () => {
    const cwd = path.join(fixturePath, 'lint-simple');
    await runCommand(binPath, ['lint'], {cwd});
  });

  test('fails when rules are not specified', async () => {
    const cwd = path.join(fixturePath, 'lint-no-polymer-json');
    const result = runCommand(binPath, ['lint'], {cwd, failureExpected: true});
    await invertPromise(result);
  });

  test('takes rules from the command line', async () => {
    const cwd = path.join(fixturePath, 'lint-no-polymer-json');
    await runCommand(binPath, ['lint', '--rules=polymer-2-hybrid'], {cwd});
  });

  test('fails when lint errors are found', async () => {
    const cwd = path.join(fixturePath, 'lint-with-error');
    const result = runCommand(binPath, ['lint'], {cwd, failureExpected: true});
    const output = await invertPromise(result);
    assert.include(
        output, 'Style tags should not be direct children of <dom-module>');
  });

  test('applies fixes to a package when requested', async () => {
    const fixtureDir = path.join(fixturePath, 'lint-fixes');
    const cwd = getTempCopy(fixtureDir);
    const output = await runCommand(binPath, ['lint', '--fix'], {cwd});
    assert.deepEqual(
        fs.readFileSync(path.join(cwd, 'toplevel-bad.html'), 'utf-8'),
        `<style>
  div {
    @apply --foo;
  }
</style>
`);

    assert.deepEqual(
        fs.readFileSync(path.join(cwd, 'subdir', 'nested-bad.html'), 'utf-8'),
        `<style>
  div {
    @apply --bar;
  }
</style>
`);

    assert.include(output, 'Made 2 changes to toplevel-bad.html');
    assert.include(output, 'Made 2 changes to subdir/nested-bad.html');
    assert.include(output, 'Fixed 2 warnings.');
  });

  test('applies fixes to a specific file when requested', async () => {
    const fixtureDir = path.join(fixturePath, 'lint-fixes');
    const cwd = getTempCopy(fixtureDir);
    const output = await runCommand(
        binPath, ['lint', '--fix', '-i', 'toplevel-bad.html'], {cwd});
    assert.deepEqual(
        fs.readFileSync(path.join(cwd, 'toplevel-bad.html'), 'utf-8'),
        `<style>
  div {
    @apply --foo;
  }
</style>
`);

    assert.deepEqual(
        fs.readFileSync(path.join(cwd, 'subdir', 'nested-bad.html'), 'utf-8'),
        `<style>
  div {
    @apply(--bar);
  }
</style>
`);

    assert.include(output, 'Made 2 changes to toplevel-bad.html');
    assert.include(output, 'Fixed 1 warning.');
  });

  test('only applies safe fixes when not prompting', async () => {
    const fixtureDir = path.join(fixturePath, 'lint-edits');
    const cwd = getTempCopy(fixtureDir);
    const result = runCommand(
        binPath, ['lint', '--fix', '--prompt=false', 'file.html'], {cwd});
    const output = await result;
    assert.deepEqual(`  Made 4 changes to file.html

Fixed 2 warnings.
`, output);
    // Running --fix with no prompt results in only the basic <content>
    // elements changing.
    assert.deepEqual(
        fs.readFileSync(path.join(cwd, 'file.html'), 'utf-8'),
        `<dom-module id="foo-elem">
  <template>
    <content select=".foo"></content>
    <slot></slot>
  </template>
  <script>
    customElements.define('foo-elem', class extends HTMLElement { });
  </script>
</dom-module>

<dom-module id="bar-elem">
  <template>
    <content select=".bar"></content>
    <slot></slot>
  </template>
  <script>
    customElements.define('bar-elem', class extends HTMLElement { });
  </script>
</dom-module>
`);
  });

  test('applies edit actions when requested by command line', async () => {
    const fixtureDir = path.join(fixturePath, 'lint-edits');
    const cwd = getTempCopy(fixtureDir);
    const result = runCommand(
        binPath,
        [
          'lint',
          '--fix',
          '--prompt=false',
          '--edits=content-with-select',
          'file.html'
        ],
        {cwd});
    const output = await result;
    assert.deepEqual(`  Made 8 changes to file.html

Fixed 4 warnings.
`, output);
    // Running --fix with no prompt results in only the basic <content>
    // elements changing.
    assert.deepEqual(
        fs.readFileSync(path.join(cwd, 'file.html'), 'utf-8'),
        `<dom-module id="foo-elem">
  <template>
    <slot name="foo" old-content-selector=".foo"></slot>
    <slot></slot>
  </template>
  <script>
    customElements.define('foo-elem', class extends HTMLElement { });
  </script>
</dom-module>

<dom-module id="bar-elem">
  <template>
    <slot name="bar" old-content-selector=".bar"></slot>
    <slot></slot>
  </template>
  <script>
    customElements.define('bar-elem', class extends HTMLElement { });
  </script>
</dom-module>
`);
  });
});

function getTempCopy(fromDir: string) {
  const toDir = fs.mkdtempSync(path.join(os.tmpdir(), path.basename(fromDir)));
  copyDir(fromDir, toDir);
  return toDir;
}

function copyDir(fromDir: string, toDir: string) {
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
};
