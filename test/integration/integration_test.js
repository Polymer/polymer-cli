/*
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

'use strict';

const path = require('path');
const runGenerator = require('yeoman-test').run;
const createGithubGenerator
  = require('../../lib/init/github').createGithubGenerator;

const runCommand = require('./run-command').runCommand;

// Template Generators
const ApplicationGenerator
  = require('../../lib/init/application/application').ApplicationGenerator;
const ElementGenerator
  = require('../../lib/init/element/element').ElementGenerator;
const ShopGenerator = createGithubGenerator({
  owner: 'Polymer',
  repo: 'shop',
});
const PSKGenerator = createGithubGenerator({
  owner: 'PolymerElements',
  repo: 'polymer-starter-kit',
});

suite('integration tests', function() {

  const binPath = path.join(__dirname, '../../', 'bin', 'polymer.js');
  const bowerPath = path.join(__dirname, '../../', 'node_modules', '.bin', 'bower');

  // Extend timeout limit to 90 seconds for slower systems
  this.timeout(90000);

  test('test the "application" template', () => {
    let dir;
    return runGenerator(ApplicationGenerator)
      .withPrompts({ name: 'my-app' }) // Mock the prompt answers
      .toPromise()
      .then((_dir) => { dir = _dir })
      .then(() => runCommand(bowerPath, ['install'], {cwd: dir}))
      .then(() => runCommand(binPath, ['lint'], {cwd: dir}))
      .then(() => runCommand(binPath, ['test'], {cwd: dir}))
      .then(() => runCommand(binPath, ['build'], {cwd: dir}));
  });

  test('test the "element" template', () => {
    let dir;
    return runGenerator(ElementGenerator)
      .withPrompts({ name: 'my-element' }) // Mock the prompt answers
      .toPromise()
      .then((_dir) => { dir = _dir })
      .then(() => runCommand(bowerPath, ['install'], {cwd: dir}))
      .then(() => runCommand(binPath, ['lint'], {cwd: dir}))
      .then(() => runCommand(binPath, ['test'], {cwd: dir}));

  });

  test('test the "shop" template', () => {
    let dir;
    return runGenerator(ShopGenerator)
      .toPromise()
      .then((_dir) => { dir = _dir })
      .then(() => runCommand(bowerPath, ['install'], {cwd: dir}))
      .then(() => runCommand(binPath, ['lint'], {cwd: dir}))
      .then(() => runCommand(binPath, ['test'], {cwd: dir}))
      .then(() => runCommand(binPath, ['build'], {cwd: dir}));
  });

  test('test the "starter-kit" template', () => {
    let dir;
    return runGenerator(PSKGenerator)
      .toPromise()
      .then((_dir) => { dir = _dir })
      .then(() => runCommand(bowerPath, ['install'], {cwd: dir}))
      .then(() => runCommand(binPath, ['lint'], {cwd: dir}))
      .then(() => runCommand(binPath, ['test'], {cwd: dir}))
      .then(() => runCommand(binPath, ['build'], {cwd: dir}));
  });

});
