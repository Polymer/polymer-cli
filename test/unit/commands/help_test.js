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

const path = require('path');
const assert = require('chai').assert;
const ProjectConfig = require('polymer-project-config').ProjectConfig;
const PolymerCli = require('../../../lib/polymer-cli').PolymerCli;
const sinon = require('sinon');

suite('help', () => {
  const expectedDefaultConfig = new ProjectConfig({
    extraDependencies: [path.resolve('bower_components/webcomponentsjs/*.js')],
  });

  test('displays help for a specific command when called with that command', () => {
    let cli = new PolymerCli(['help', 'build']);
    let helpCommand = cli.commands.get('help');
    let helpCommandSpy = sinon.spy(helpCommand, 'run');
    cli.run();
    assert.isOk(helpCommandSpy.calledOnce);
    assert.deepEqual(
      helpCommandSpy.firstCall.args,
      [{command: 'build'}, expectedDefaultConfig]
    );
  });

  test('displays general help when the help command is called with no arguments', () => {
    let cli = new PolymerCli(['help']);
    let helpCommand = cli.commands.get('help');
    let helpCommandSpy = sinon.spy(helpCommand, 'run');
    cli.run();
    assert.isOk(helpCommandSpy.calledOnce);
    assert.deepEqual(helpCommandSpy.firstCall.args, [{}, expectedDefaultConfig]);
  });

});
