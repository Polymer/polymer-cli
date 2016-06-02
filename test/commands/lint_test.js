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
const ProjectConfig = require('../../lib/project-config').ProjectConfig;
const PolymerCli = require('../../lib/polymer-cli').PolymerCli;
const polylintCli = require('polylint/lib/cli');
const sinon = require('sinon');

suite('lint', () => {

  let polylintCliStub;

  setup(function() {
    polylintCliStub = sinon.stub(polylintCli, 'runWithOptions').returns(Promise.resolve());
  });

  teardown(() => {
    polylintCliStub.restore();
  });

  test('lints the entrypoint, shell, and fragments when no specific inputs are given', () => {
    let testLintConfig = new ProjectConfig(null, {
      entrypoint: 'index.html',
      fragments: ['foo.html'],
      shell: 'bar.html',
    });
    let cli = new PolymerCli(['lint'], testLintConfig);
    cli.run();
    assert.isOk(polylintCliStub.calledOnce);
    assert.deepEqual(polylintCliStub.firstCall.args[0].input, [`${path.sep}index.html`, `${path.sep}bar.html`, `${path.sep}foo.html`]);
  });

});
