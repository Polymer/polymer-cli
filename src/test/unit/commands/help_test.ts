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
import {ProjectConfig} from 'polymer-project-config';
import * as sinon from 'sinon';

import {PolymerCli} from '../../../polymer-cli';

suite('help', () => {
  const expectedDefaultConfig = new ProjectConfig({
    extraDependencies: [path.resolve('bower_components/webcomponentsjs/*.js')],
  });

  let testName =
      'displays help for a specific command when called with that command';
  test(testName, async () => {
    const cli = new PolymerCli(['help', 'build']);
    const helpCommand = cli.commands.get('help')!;
    const helpCommandSpy = sinon.spy(helpCommand, 'run');
    await cli.run();
    assert.isOk(helpCommandSpy.calledOnce);
    assert.deepEqual(
        helpCommandSpy.firstCall.args,
        [{command: 'build'}, expectedDefaultConfig]);
  });

  testName =
      'displays general help when the help command is called with no arguments';
  test(testName, async () => {
    const cli = new PolymerCli(['help']);
    const helpCommand = cli.commands.get('help')!;
    const helpCommandSpy = sinon.spy(helpCommand, 'run');
    await cli.run();
    assert.isOk(helpCommandSpy.calledOnce);
    assert.deepEqual(
        helpCommandSpy.firstCall.args, [{}, expectedDefaultConfig]);
  });

});
