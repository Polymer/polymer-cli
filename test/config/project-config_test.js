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

  test('reads options from config file', () => {
    let defaultOptions = ProjectConfig.fromConfigFile(path.join(__dirname, 'polymer.json'));
    assert.deepEqual(defaultOptions, {
      entrypoint: 'foo.html',
      fragments: ['bar.html'],
      includeDependencies: ['baz.html'],
      sourceGlobs: ['src/**/*', 'images/**/*'],
    });
  });

  test('sane config defaults', () => {
    let config = new ProjectConfig();
    assert.equal(config.root, process.cwd());
    assert.equal(config.entrypoint, path.resolve('index.html'));
    assert.equal(config.shell, undefined);
    assert.equal(config.includeDependencies, undefined);
    assert.deepEqual(config.fragments, []);
    assert.deepEqual(config.sourceGlobs, ['src/**/*', 'bower.json']);
  });

  test('sets config from options object', () => {
    let defaultOptions = ProjectConfig.fromConfigFile(path.join(__dirname, 'polymer.json'));
    let config = new ProjectConfig(defaultOptions);
    assert.equal(config.root, process.cwd());
    assert.equal(config.entrypoint, path.resolve('foo.html'));
    assert.deepEqual(config.sourceGlobs, ['src/**/*', 'images/**/*']);
    assert.deepEqual(config.includeDependencies, ['baz.html']);
    assert.deepEqual(config.fragments, [path.resolve('bar.html')])
  });

  test('read config from flags', () => {
    let config = new ProjectConfig(null, {
      entrypoint: 'index.html',
      fragments: ['foo.html'],
      shell: 'bar.html',
      'include-dependencies': ['bower_components/webcomponents_js/**/*'],
    });
    assert.equal(config.root, process.cwd());
    assert.equal(config.entrypoint, path.resolve('index.html'));
    assert.equal(config.shell, path.resolve('bar.html'));
    assert.deepEqual(config.fragments, [path.resolve('foo.html')]);
    assert.deepEqual(config.includeDependencies, ['bower_components/webcomponents_js/**/*']);
  });

  test('flags override default config values', () => {
    let defaultOptions = ProjectConfig.fromConfigFile(path.join(__dirname, 'polymer.json'));
    let config = new ProjectConfig(defaultOptions, {
      entrypoint: 'bar.html',
      fragments: [],
      shell: 'zizz.html',
      sources: ['src/**/*', 'index.html'],
    });
    assert.equal(config.entrypoint, path.resolve('bar.html'));
    assert.deepEqual(config.includeDependencies, ['baz.html']);
    assert.deepEqual(config.sourceGlobs, ['src/**/*', 'index.html']);
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

  test('fails build immediately for invalid polymer.json', () => {
    assert.throws(() => ProjectConfig.fromConfigFile(path.join(__dirname, 'polymer-invalid.json')));
  });

});
