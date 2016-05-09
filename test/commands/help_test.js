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

const assert = require('chai').assert;
const Polytool = require('../../lib/polytool').Polytool;
const sinon = require('sinon');

suite('help', () => {

  test('displays general help when the help command is called with no arguments', () => {
    let polytool = new Polytool();
    let helpCommand = polytool.commands.get('help');
    let helpCommandSpy = sinon.spy(helpCommand, 'run');
    polytool.run(['help']);
    assert.isOk(helpCommandSpy.calledOnce);
    assert.deepEqual(helpCommandSpy.firstCall.args, [{}]);
  });

  test('displays general help when no command is called', () => {
    let polytool = new Polytool();
    let helpCommand = polytool.commands.get('help');
    let helpCommandSpy = sinon.spy(helpCommand, 'run');
    polytool.run([]);
    assert.isOk(helpCommandSpy.calledOnce);
    assert.deepEqual(helpCommandSpy.firstCall.args, [undefined]);
  });

  test('displays general help when unknown command is called', () => {
    let polytool = new Polytool();
    let helpCommand = polytool.commands.get('help');
    let helpCommandSpy = sinon.spy(helpCommand, 'run');
    polytool.run(['THIS_IS_SOME_UNKNOWN_COMMAND']);
    assert.isOk(helpCommandSpy.calledOnce);
    assert.deepEqual(helpCommandSpy.firstCall.args, [undefined]);
  });

});
