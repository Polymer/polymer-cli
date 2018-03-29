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
import {child_process} from 'mz';

const fixturePath =
    path.join(__dirname, '../../../src/test/integration/fixtures/');

suite('polymer lint', function() {

  const binPath = path.join(__dirname, '../../../bin/polymer.js');

  this.timeout(8 * 1000);

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

    assert.deepEqual(output.trim(), `
Made changes to:
  toplevel-bad.html
  subdir/nested-bad.html

Fixed 2 warnings.
`.trim());
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

    assert.deepEqual(output.trim(), `
Made changes to:
  toplevel-bad.html

Fixed 1 warning.
`.trim());
  });

  test('only applies safe fixes when not prompting', async () => {
    const fixtureDir = path.join(fixturePath, 'lint-edits');
    const cwd = getTempCopy(fixtureDir);
    const result = runCommand(
        binPath, ['lint', '--fix', '--prompt=false', 'file.html'], {cwd});
    const output = await result;
    assert.deepEqual(output.trim(), `
Made changes to:
  file.html

Fixed 2 warnings.`.trim());
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
    assert.deepEqual(output.trim(), `
Made changes to:
  file.html

Fixed 4 warnings.
`.trim());
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

  test('--npm finds dependencies in "node_modules"', async () => {
    const cwd = path.join(fixturePath, 'element-with-npm-deps');
    await runCommand(binPath, ['lint', '--npm'], {cwd});
  });

  test(
      '--component-dir finds dependencies in the specified directory',
      async () => {
        const cwd = path.join(fixturePath, 'element-with-other-deps');
        await runCommand(
            binPath, ['lint', '--component-dir=path/to/deps/'], {cwd});
      });

  suite('--watch', function() {

    this.timeout(12 * 1000);

    const delimiter =
        `\nLint pass complete, waiting for filesystem changes.\n\n`;
    let testName = 're-reports lint results when the filesystem changes';
    test(testName, async () => {
      const fixtureDir = path.join(fixturePath, 'lint-simple');
      const cwd = getTempCopy(fixtureDir);
      const forkedProcess =
          child_process.fork(binPath, ['lint', '--watch'], {cwd, silent: true});
      const reader = new StreamReader(forkedProcess.stdout);
      assert.deepEqual(await reader.readUntil(delimiter), '');
      fs.writeFileSync(
          path.join(cwd, 'my-elem.html'),
          '<style>\nfoo {@apply(--bar)}\n</style>');
      assert.deepEqual(await reader.readUntil(delimiter), `

foo {@apply(--bar)}
           ~~~~~~~

my-elem.html(2,12) error [at-apply-with-parens] - @apply with parentheses is deprecated. Prefer: @apply --foo;


Found 1 error. 1 can be automatically fixed with --fix.
`);
      // Wait for a moment
      await sleep(300);
      // Fix the error
      fs.writeFileSync(
          path.join(cwd, 'my-elem.html'),
          '<style>\nfoo {@apply --bar}\n</style>');
      // Expect empty output again.
      assert.deepEqual(await reader.readUntil(delimiter), ``);
      // Expect no other output.
      await sleep(200);
      assert.deepEqual(await reader.readRestOfBuffer(), '');
      forkedProcess.kill();
    });

    testName = 'with --fix, reports and fixes when the filesystem changes';
    test(testName, async () => {
      const fixtureDir = path.join(fixturePath, 'lint-simple');
      const cwd = getTempCopy(fixtureDir);
      const forkedProcess = child_process.fork(
          binPath, ['lint', '--watch', '--fix'], {cwd, silent: true});
      const reader = new StreamReader(forkedProcess.stdout);
      // The first pass yields no warnings:
      assert.deepEqual(
          await reader.readUntil(delimiter), 'No fixes to apply.\n');
      // Add an error
      fs.writeFileSync(
          path.join(cwd, 'my-elem.html'),
          '<style>\nfoo {@apply(--bar)}\n</style>');
      // Expect warning output.
      assert.deepEqual((await reader.readUntil(delimiter)).trim(), `
Made changes to:
  my-elem.html

Fixed 1 warning.
`.trim());
      // The automated fix triggers the linter to run again.
      assert.deepEqual(
          await reader.readUntil(delimiter), 'No fixes to apply.\n');
      // Expect no other output.
      await sleep(200);
      assert.deepEqual(await reader.readRestOfBuffer(), '');
      forkedProcess.kill();
    });
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

/** Simple class for reading up to a delimitor in an unending stream. */
class StreamReader {
  private buffer = '';
  private wakeup: () => void = () => undefined;
  constructor(readStream: NodeJS.ReadableStream) {
    readStream.setEncoding('utf8');
    readStream.on('data', (chunk: string) => {
      this.buffer += chunk;
      if (this.wakeup) {
        this.wakeup();
      }
    });
  }

  async readUntil(text: string) {
    while (true) {
      const index = this.buffer.indexOf(text);
      if (index >= 0) {
        const result = this.buffer.slice(0, index);
        this.buffer = this.buffer.slice(index + text.length + 1);
        return result;
      }
      await new Promise<void>((resolve) => {
        this.wakeup = resolve;
      });
    }
  }

  async readRestOfBuffer() {
    const result = this.buffer;
    this.buffer = '';
    return result;
  }
}

async function sleep(millis: number) {
  return new Promise((resolve) => setTimeout(resolve, millis));
}
