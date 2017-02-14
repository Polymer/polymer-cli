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
const createApplicationGenerator
  = require('../../lib/init/application/application').createApplicationGenerator;
const createElementGenerator
  = require('../../lib/init/element/element').createElementGenerator;
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

  // TODO(https://github.com/Polymer/polymer-cli/issues/562): these tests are broken.
  test('test the polymer 1.x application template', () => {
    let dir;
    return runGenerator(createApplicationGenerator('polymer-1.x'))
      .withPrompts({ name: 'my-app' }) // Mock the prompt answers
      .toPromise()
      .then((_dir) => { dir = _dir })
      .then(() => runCommand(bowerPath, ['install'], {cwd: dir}))
      // .then(() => runCommand(binPath, ['lint'], {cwd: dir}))
      .then(() => runCommand(binPath, ['test'], {cwd: dir}))
      .then(() => runCommand(binPath, ['build'], {cwd: dir}));
  });

  test('test the polymer 2.x application template', () => {
    let dir;
    return runGenerator(createApplicationGenerator('polymer-2.x'))
      .withPrompts({ name: 'my-app' }) // Mock the prompt answers
      .toPromise()
      .then((_dir) => { dir = _dir })
      .then(() => runCommand(bowerPath, ['install'], { cwd: dir }))
      // TODO(rictic): reenable with new linter.
      // .then(() => runCommand(binPath, ['lint'], {cwd: dir}))
      // TODO(fks?): look into why tests are failing here
      // .then(() => runCommand(binPath, ['test'], {cwd: dir}))
      .then(() => runCommand(binPath, ['build'], {cwd: dir}));
  });

  test('test the polymer 2.x "element" template', () => {
    let dir;
    return runGenerator(createElementGenerator('polymer-2.x'))
      .withPrompts({ name: 'my-element' }) // Mock the prompt answers
      .toPromise()
      .then((_dir) => { dir = _dir })
      .then(() => runCommand(bowerPath, ['install'], { cwd: dir }))
      // TODO(rictic): reenable with new linter.
      // .then(() => runCommand(binPath, ['lint'], {cwd: dir}))
      // TODO(fks?): look into why tests are failing here
      // .then(() => runCommand(binPath, ['test'], {cwd: dir}));
  });

  test('test the polymer 1.x "element" template', () => {
    let dir;
    return runGenerator(createElementGenerator('polymer-1.x'))
      .withPrompts({ name: 'my-element' }) // Mock the prompt answers
      .toPromise()
      .then((_dir) => { dir = _dir })
      .then(() => runCommand(bowerPath, ['install'], { cwd: dir }))
      // TODO(rictic): reenable with new linter.
      // .then(() => runCommand(binPath, ['lint'], {cwd: dir}))
      .then(() => runCommand(binPath, ['test'], {cwd: dir}));
  });

  test('test the "shop" template', () => {
    let dir;
    return runGenerator(ShopGenerator)
      .toPromise()
      .then((_dir) => { dir = _dir })
      .then(() => runCommand(bowerPath, ['install'], {cwd: dir}))
      // TODO(rictic): reenable with new linter.
      // .then(() => runCommand(binPath, ['lint'], {cwd: dir}))
      .then(() => runCommand(binPath, ['test'], {cwd: dir}))
      .then(() => runCommand(binPath, ['build'], {cwd: dir}));
  });

  test('test the "starter-kit" template', () => {
    let dir;
    return runGenerator(PSKGenerator)
      .toPromise()
      .then((_dir) => { dir = _dir })
      .then(() => runCommand(bowerPath, ['install'], { cwd: dir }))
      // TODO(rictic): reenable with new linter.
      // .then(() => runCommand(binPath, ['lint'], {cwd: dir}))
      .then(() => runCommand(binPath, ['test'], {cwd: dir}))
      .then(() => runCommand(binPath, ['build'], {cwd: dir}));
  });

});
