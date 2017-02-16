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

// A zero priveledge github token of a nonce account, used for quota.
const githubToken = '8d8622bf09bb1d85cb411b5e475a35e742a7ce35';

const ShopGenerator = createGithubGenerator({
  owner: 'Polymer',
  repo: 'shop',
  githubToken
});
const PSKGenerator = createGithubGenerator({
  owner: 'PolymerElements',
  repo: 'polymer-starter-kit',
  githubToken
});

suite('integration tests', function() {

  const binPath = path.join(__dirname, '../../', 'bin', 'polymer.js');

  // Extend timeout limit to 90 seconds for slower systems
  this.timeout(90000);

  // TODO(#562): enable test commands.
  // TODO(rictic): run linter once new linter lands.
  test('test the polymer 1.x application template', () => {
    let dir;
    return runGenerator(createApplicationGenerator('polymer-1.x'))
      .withPrompts({ name: 'my-app' }) // Mock the prompt answers
      .toPromise()
      .then((_dir) => { dir = _dir })
      .then(() => runCommand(binPath, ['install'], {cwd: dir}))
      // .then(() => runCommand(binPath, ['lint'], {cwd: dir}))
      // .then(() => runCommand(binPath, ['test'], {cwd: dir}))
      .then(() => runCommand(binPath, ['build'], {cwd: dir}));
  });

  test('test the polymer 2.x application template', () => {
    let dir;
    return runGenerator(createApplicationGenerator('polymer-2.x'))
      .withPrompts({ name: 'my-app' }) // Mock the prompt answers
      .toPromise()
      .then((_dir) => { dir = _dir })
      .then(() => runCommand(binPath, ['install'], { cwd: dir }))
      // .then(() => runCommand(binPath, ['lint'], {cwd: dir}))
      // .then(() => runCommand(binPath, ['test'], {cwd: dir}))
      .then(() => runCommand(binPath, ['build'], {cwd: dir}));
  });

  test('test the polymer 2.x "element" template', () => {
    let dir;
    return runGenerator(createElementGenerator('polymer-2.x'))
      .withPrompts({ name: 'my-element' }) // Mock the prompt answers
      .toPromise()
      .then((_dir) => { dir = _dir })
      .then(() => runCommand(binPath, ['install'], { cwd: dir }))
      // .then(() => runCommand(binPath, ['lint'], {cwd: dir}))
      // .then(() => runCommand(binPath, ['test'], {cwd: dir}));
  });

  test('test the polymer 1.x "element" template', () => {
    let dir;
    return runGenerator(createElementGenerator('polymer-1.x'))
      .withPrompts({ name: 'my-element' }) // Mock the prompt answers
      .toPromise()
      .then((_dir) => { dir = _dir })
      .then(() => runCommand(binPath, ['install'], { cwd: dir }))
      // TODO(rictic): reenable with new linter.
      // .then(() => runCommand(binPath, ['lint'], {cwd: dir}))
      // .then(() => runCommand(binPath, ['test'], {cwd: dir}));
  });

  test('test the "shop" template', () => {
    let dir;
    return runGenerator(ShopGenerator)
      .toPromise()
      .then((_dir) => { dir = _dir })
      .then(() => runCommand(binPath, ['install'], {cwd: dir}))
      // .then(() => runCommand(binPath, ['lint'], {cwd: dir}))
      // .then(() => runCommand(binPath, ['test'], {cwd: dir}))
      .then(() => runCommand(binPath, ['build'], {cwd: dir}));
  });

  test('test the "starter-kit" template', () => {
    let dir;
    return runGenerator(PSKGenerator)
      .toPromise()
      .then((_dir) => { dir = _dir })
      .then(() => runCommand(binPath, ['install'], { cwd: dir }))
      // .then(() => runCommand(binPath, ['lint'], {cwd: dir}))
      // .then(() => runCommand(binPath, ['test'], {cwd: dir}))
      .then(() => runCommand(binPath, ['build'], {cwd: dir}));
  });

});
