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
const sinon = require('sinon');
const PolymerCli = require('../../../lib/polymer-cli').PolymerCli;
const polymerInit = require('../../../lib/init/init');

suite('init', () => {
  let sandbox;

  setup(() => {
    sandbox = sinon.sandbox.create();
  });

  teardown(() => {
    sandbox.restore();
  });

  test('runs the given generator when name argument is provided', () => {
    let runGeneratorStub = sandbox.stub(polymerInit, 'runGenerator').returns(Promise.resolve());
    let cli = new PolymerCli(['init', 'shop'], null);
    cli.run();
    assert.isOk(runGeneratorStub.calledOnce);
    assert.isOk(runGeneratorStub.calledWith(`polymer-init-shop:app`, {
      name: 'shop',
    }));
  });

  test('prompts the user to select a generator when no argument is provided', () => {
    let promptSelectionStub = sandbox.stub(polymerInit, 'promptGeneratorSelection').returns(Promise.resolve());
    let cli = new PolymerCli(['init'], null);
    cli.run();
    assert.isOk(promptSelectionStub.calledOnce);
  });

});
