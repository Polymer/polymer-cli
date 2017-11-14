/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {assert} from 'chai';
import * as path from 'path';
import * as logging from 'plylog';
import * as sinon from 'sinon';

import {PolymerCli} from '../../../polymer-cli';

const packageJSON = require('../../../../package.json');

suite('The general CLI', () => {

  test('displays general help when no command is called', async () => {
    const cli = new PolymerCli([]);
    const helpCommand = cli.commands.get('help');
    const helpCommandSpy = sinon.spy(helpCommand!, 'run');
    await cli.run();
    assert.isOk(helpCommandSpy.calledOnce);
    assert.deepEqual(helpCommandSpy.firstCall.args[0], {command: null});
  });

  let testName =
      'displays general help when no command is called with the --help flag';
  test(testName, async () => {
    const cli = new PolymerCli(['--help']);
    const helpCommand = cli.commands.get('help');
    const helpCommandSpy = sinon.spy(helpCommand!, 'run');
    await cli.run();
    assert.isOk(helpCommandSpy.calledOnce);
    assert.deepEqual(helpCommandSpy.firstCall.args[0], {command: null});
  });

  test('displays general help when unknown command is called', async () => {
    const cli = new PolymerCli(['THIS_IS_SOME_UNKNOWN_COMMAND']);
    const helpCommand = cli.commands.get('help');
    const helpCommandSpy = sinon.spy(helpCommand!, 'run');
    await cli.run();
    assert.isOk(helpCommandSpy.calledOnce);
    assert.deepEqual(
        helpCommandSpy.firstCall.args[0],
        {command: 'THIS_IS_SOME_UNKNOWN_COMMAND'});
  });

  test('displays command help when called with the --help flag', async () => {
    const cli = new PolymerCli(['build', '--help']);
    const helpCommand = cli.commands.get('help');
    const helpCommandSpy = sinon.spy(helpCommand!, 'run');
    await cli.run();
    assert.isOk(helpCommandSpy.calledOnce);
    assert.deepEqual(helpCommandSpy.firstCall.args[0], {command: 'build'});
  });

  test('displays command help when called with the -h flag', async () => {
    const cli = new PolymerCli(['init', '-h']);
    const helpCommand = cli.commands.get('help');
    const helpCommandSpy = sinon.spy(helpCommand!, 'run');
    await cli.run();
    assert.isOk(helpCommandSpy.calledOnce);
    assert.deepEqual(helpCommandSpy.firstCall.args[0], {command: 'init'});
  });

  testName = 'displays version information when called with the --version flag';
  test(testName, async () => {
    const cli = new PolymerCli(['--version']);
    const consoleLogSpy = sinon.spy(console, 'log');
    await cli.run();
    assert.isOk(consoleLogSpy.calledWithExactly(packageJSON.version));
    consoleLogSpy.restore();
  });

  testName = `sets the appropriate log levels when ` +
      `the --verbose & --quiet flags are used`;
  test(testName, () => {
    const logger = logging.getLogger('TEST_LOGGER');
    new PolymerCli(['help', '--verbose']);
    assert.equal((logger as any)['level'], 'debug');
    new PolymerCli(['help', '--quiet']);
    assert.equal((logger as any)['level'], 'error');
  });

  test('read config from flags', async () => {
    const cli = new PolymerCli([
      'build',
      '--root',
      'public-cli',
      '--entrypoint',
      'foo-cli.html',
      '--shell',
      'bar-cli.html',
      '--sources',
      '**/*',
      '--extra-dependencies',
      'bower_components/baz-cli/**/*',
    ]);
    const buildCommand = cli.commands.get('build');
    const buildCommandStub =
        sinon.stub(buildCommand!, 'run').returns(Promise.resolve());
    await cli.run();
    assert.isOk(buildCommandStub.calledOnce);
    const config = buildCommandStub.firstCall.args[1];
    const expectedRoot = path.resolve('public-cli');
    assert.equal(config.root, expectedRoot);
    assert.equal(config.entrypoint, path.resolve(expectedRoot, 'foo-cli.html'));
    assert.equal(config.shell, path.resolve(expectedRoot, 'bar-cli.html'));
    assert.deepEqual(
        config.extraDependencies,
        [path.resolve(expectedRoot, 'bower_components/baz-cli/**/*')]);
    assert.deepEqual(config.sources, [
      path.resolve(expectedRoot, '**/*'),
      path.resolve(expectedRoot, 'foo-cli.html'),
      path.resolve(expectedRoot, 'bar-cli.html'),
    ]);
  });

  test('flags override default config values', async () => {
    const cli = new PolymerCli(
        [
          'build',
          '--root',
          'public-cli',
          '--entrypoint',
          'foo-cli.html',
          '--extra-dependencies',
          'bower_components/baz-cli/**/*',
        ],
        {
          root: 'public',
          entrypoint: 'foo.html',
          shell: 'bar.html',
          extraDependencies: ['bower_components/baz/**/*'],
          sources: ['src/**'],
        });
    const buildCommand = cli.commands.get('build');
    const buildCommandStub =
        sinon.stub(buildCommand!, 'run').returns(Promise.resolve());
    await cli.run();
    assert.isOk(buildCommandStub.calledOnce);
    const config = buildCommandStub.firstCall.args[1];
    const expectedRoot = path.resolve('public-cli');
    assert.equal(config.root, expectedRoot);
    assert.equal(config.entrypoint, path.resolve(expectedRoot, 'foo-cli.html'));
    assert.equal(config.shell, path.resolve(expectedRoot, 'bar.html'));
    assert.deepEqual(
        config.extraDependencies,
        [path.resolve(expectedRoot, 'bower_components/baz-cli/**/*')]);
    assert.deepEqual(config.sources, [
      path.resolve(expectedRoot, 'src/**'),
      path.resolve(expectedRoot, 'foo-cli.html'),
      path.resolve(expectedRoot, 'bar.html'),
    ]);
  });

});
