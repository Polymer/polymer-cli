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
'use strict';

const path = require('path');
const sinon = require('sinon');
const assert = require('chai').assert;
const ProjectConfig = require('polymer-project-config').ProjectConfig;
const PolymerCli = require('../../../lib/polymer-cli').PolymerCli;

const polymerInstall = require('../../../lib/install/install');

suite('install', () => {

  suite('runs command', () => {

    const expectedDefaultConfig = new ProjectConfig({
      extraDependencies: [path.resolve('bower_components/webcomponentsjs/*.js')],
    });

    test('using full command name', () => {
      let cli = new PolymerCli(['install']);
      let installCommand = cli.commands.get('install');
      let installCommandSpy = sinon.stub(installCommand, 'run');
      return cli.run().then(() => {
        assert.isOk(installCommandSpy.calledOnce);
        assert.deepEqual(
            installCommandSpy.firstCall.args,
            [{offline: false, variants: false}, expectedDefaultConfig]);
      });
    });

    test('using aliased command name', () => {
      let cli = new PolymerCli(['i']);
      let installCommand = cli.commands.get('install');
      let installCommandSpy = sinon.stub(installCommand, 'run');
      return cli.run().then(() => {
        assert.isOk(installCommandSpy.calledOnce);
        assert.deepEqual(
            installCommandSpy.firstCall.args,
            [{offline: false, variants: false}, expectedDefaultConfig]);
      });
    });

    test('using aliased command name with argument', () => {
      let cli = new PolymerCli(['i', '--variants']);
      let installCommand = cli.commands.get('install');
      let installCommandSpy = sinon.stub(installCommand, 'run');
      return cli.run().then(() => {
        assert.isOk(installCommandSpy.calledOnce);
        assert.deepEqual(
            installCommandSpy.firstCall.args,
            [{offline: false, variants: true}, expectedDefaultConfig]);
      });
    });

  });

  suite('_mergeJson', () => {

    test('overwrites primitives and arrays', () => {
      const from = {
        'a': 'bar',
        'b': 2,
        'c': false,
        'd': 'not null',
        'e': ['non-empty'],
        'g': 'no collision',
      };
      const to = {
        'a': 'foo',
        'b': 1,
        'c': true,
        'd': null,
        'e': [],
        'f': 'not overwritten',
      };
      const merged = polymerInstall._mergeJson(from, to);
      assert.deepEqual(merged, {
        'a': 'bar',
        'b': 2,
        'c': false,
        'd': 'not null',
        'e': ['non-empty'],
        'f': 'not overwritten',
        'g': 'no collision',
      });
    });

    test('merges nested objects', () => {
      const from = {
        'a': {
          'b': {
            'c': 'bar',
          },
        },
      };
      const to = {
        'a': {
          'b': {
            'c': 'foo',
            'd': 'baz',
          },
          'e': 'qux',
        },
      };
      const merged = polymerInstall._mergeJson(from, to);
      assert.deepEqual(merged, {
        'a': {
          'b': {
            'c': 'bar',
            'd': 'baz',
          },
          'e': 'qux',
        },
      });
    });
  });

});
