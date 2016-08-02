/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

'use strict';

const Config = require('../../lib/project-config').ProjectConfig;
const packageJSON = require('../../package.json');
const PolymerCli = require('../../lib/polymer-cli').PolymerCli;
const logging = require('plylog');
const assert = require('chai').assert;
const sinon = require('sinon');

suite('The general CLI', () => {

  const defaultConfig = new Config();

  test('displays general help when no command is called', () => {
    let cli = new PolymerCli([]);
    let helpCommand = cli.commands.get('help');
    let helpCommandSpy = sinon.spy(helpCommand, 'run');
    return cli.run().then(() => {
      assert.isOk(helpCommandSpy.calledOnce);
      assert.deepEqual(helpCommandSpy.firstCall.args, [{command: null}, defaultConfig]);
    });
  });

  test('displays general help when no command is called with the --help flag', () => {
    let cli = new PolymerCli(['--help']);
    let helpCommand = cli.commands.get('help');
    let helpCommandSpy = sinon.spy(helpCommand, 'run');
    return cli.run().then(() => {
      assert.isOk(helpCommandSpy.calledOnce);
      assert.deepEqual(helpCommandSpy.firstCall.args, [{command: null}, defaultConfig]);
    });
  });

  test('displays general help when unknown command is called', () => {
    let cli = new PolymerCli(['THIS_IS_SOME_UNKNOWN_COMMAND']);
    let helpCommand = cli.commands.get('help');
    let helpCommandSpy = sinon.spy(helpCommand, 'run');
    return cli.run().then(() => {
      assert.isOk(helpCommandSpy.calledOnce);
      assert.deepEqual(helpCommandSpy.firstCall.args, [{command: 'THIS_IS_SOME_UNKNOWN_COMMAND'}, defaultConfig]);
    });
  });

  test('displays command help when called with the --help flag', () => {
    let cli = new PolymerCli(['build', '--help']);
    let helpCommand = cli.commands.get('help');
    let helpCommandSpy = sinon.spy(helpCommand, 'run');
    return cli.run().then(() => {
      assert.isOk(helpCommandSpy.calledOnce);
      assert.deepEqual(
        helpCommandSpy.firstCall.args,
        [{command: 'build'}, defaultConfig]
      );
    });
  });

  test('displays command help when called with the -h flag', () => {
    let cli = new PolymerCli(['init', '-h']);
    let helpCommand = cli.commands.get('help');
    let helpCommandSpy = sinon.spy(helpCommand, 'run');
    return cli.run().then(() => {
      assert.isOk(helpCommandSpy.calledOnce);
      assert.deepEqual(
        helpCommandSpy.firstCall.args,
        [{command: 'init'}, defaultConfig]
      );
    });
  });

  test('displays version information when called with the --version flag', () => {
    let cli = new PolymerCli(['--version']);
    let consoleLogSpy = sinon.spy(console, 'log');
    return cli.run().then(() => {
      assert.isOk(consoleLogSpy.calledWithExactly(packageJSON.version));
      consoleLogSpy.restore();
    });
  });

  test('sets the appropriate log levels when the --verbose & --quiet flags are used', () => {
    let logger = logging.getLogger('TEST_LOGGER');
    new PolymerCli(['help', '--verbose']);
    assert.equal(logger.level, 'debug');
    new PolymerCli(['help', '--quiet']);
    assert.equal(logger.level, 'error');
  });

});
