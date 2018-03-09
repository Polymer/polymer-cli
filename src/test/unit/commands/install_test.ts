/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
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

suite('install', () => {
  const expectedDefaultConfig = new ProjectConfig({
    extraDependencies: [path.resolve('bower_components/webcomponentsjs/*.js')],
  });

  test('runs using full command name', async () => {
    const cli = new PolymerCli(['install']);
    const installCommand = cli.commands.get('install')!;
    const installCommandSpy = sinon.stub(installCommand, 'run');
    await cli.run();
    assert.isOk(installCommandSpy.calledOnce);
    assert.deepEqual(
        installCommandSpy.firstCall.args,
        [{offline: false, variants: false}, expectedDefaultConfig]);
  });

  test('runs using aliased command name', async () => {
    const cli = new PolymerCli(['i']);
    const installCommand = cli.commands.get('install')!;
    const installCommandSpy = sinon.stub(installCommand, 'run');
    await cli.run();
    assert.isOk(installCommandSpy.calledOnce);
    assert.deepEqual(
        installCommandSpy.firstCall.args,
        [{offline: false, variants: false}, expectedDefaultConfig]);
  });

  test('runs using aliased command name with argument', async () => {
    const cli = new PolymerCli(['i', '--variants']);
    const installCommand = cli.commands.get('install')!;
    const installCommandSpy = sinon.stub(installCommand, 'run');
    await cli.run();
    assert.isOk(installCommandSpy.calledOnce);
    assert.deepEqual(
        installCommandSpy.firstCall.args,
        [{offline: false, variants: true}, expectedDefaultConfig]);
  });

});
