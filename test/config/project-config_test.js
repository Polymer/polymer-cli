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
const path = require('path');
const ProjectConfig = require('../../lib/project-config').ProjectConfig;

suite('Project Config', () => {
  test('sane defaults', () => {
    let config = new ProjectConfig();
    assert.equal(config.root, process.cwd());
    assert.equal(config.entrypoint, path.resolve('index.html'));
    assert.equal(config.shell, undefined);
    assert.deepEqual(config.fragments, []);
  });

  test('read from flags', () => {
    let config = new ProjectConfig(null, {
      entrypoint: 'index.html',
      fragments: ['foo.html'],
      shell: 'bar.html'
    });
    assert.equal(config.root, process.cwd());
    assert.equal(config.entrypoint, path.resolve('index.html'));
    assert.equal(config.shell, path.resolve('bar.html'));
    assert.deepEqual(config.fragments, [path.resolve('foo.html')]);
  });

  test('inits from config file', () => {
    let config = new ProjectConfig(path.join(__dirname, 'polymer.json'));
    assert.equal(config.root, process.cwd());
    assert.equal(config.entrypoint, path.resolve('foo.html'));
    assert.deepEqual(config.fragments, [path.resolve('bar.html')])
  });

  test('flags override config file', () => {
    let config = new ProjectConfig(path.join(__dirname, 'polymer.json'), {
      entrypoint: 'bar.html',
      fragments: [],
      shell: 'zizz.html',
    });
    assert.equal(config.entrypoint, path.resolve('bar.html'));
    assert.deepEqual(config.fragments, []);
    assert.equal(config.shell, path.resolve('zizz.html'));
  });

  test('Read bower.json for "main"', () => {
    let config = new ProjectConfig(null, {
      root: path.resolve(__dirname, 'bower'),
    });
    assert.equal(config.entrypoint, path.resolve(__dirname, 'bower', 'foo.html'));
  });

  test('bower.json, missing main', () => {
    let config = new ProjectConfig(null, {
      root: path.resolve(__dirname, 'broken-bower'),
    });
    assert.equal(config.entrypoint, path.resolve(__dirname, 'broken-bower', 'index.html'));
  });
});
