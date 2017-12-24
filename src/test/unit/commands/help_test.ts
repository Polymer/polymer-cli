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

import {PolymerCli} from '../../../polymer-cli';
import {interceptOutput} from '../../util';

suite('help', () => {
  let testName =
      'displays help for a specific command when called with that command';
  test(testName, async () => {
    const cli = new PolymerCli(['help', 'build']);
    const output = await interceptOutput(async () => {
      await cli.run();
    });
    assert.include(output, 'polymer build');
    assert.include(output, 'Command Options');
    assert.include(output, '--bundle');
  });

  testName =
      'displays general help when the help command is called with no arguments';
  test(testName, async () => {
    const cli = new PolymerCli(['help']);
    const output = await interceptOutput(async () => {
      await cli.run();
    });
    assert.include(output, 'Usage: `polymer <command>');
  });

});
