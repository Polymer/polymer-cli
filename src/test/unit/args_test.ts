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
import {ArgDescriptor} from 'command-line-args';

import * as argsLib from '../../args';
import * as cliLib from '../../polymer-cli';

suite('args', () => {

  suite('mergeArguments', () => {

    test('merges argument lists', () => {
      const merged = argsLib.mergeArguments([
        [
          {
            name: 'one',
            description: 'description one',
            group: 'group one',
          },
          {
            name: 'two',
            type: String,
            description: 'description two',
            group: 'group two',
          },
        ],
        [
          {
            name: 'two',
            description: 'description two modified',
            group: 'group two',
            multiple: true,
          },
          {
            name: 'three',
            description: 'description three',
            group: 'group three',
          },
        ],
      ]);
      assert.deepEqual(merged, [
        {
          name: 'one',
          description: 'description one',
          group: 'group one',
        },
        {
          name: 'two',
          type: String,
          description: 'description two modified',
          group: 'group two',
          multiple: true,
        },
        {
          name: 'three',
          description: 'description three',
          group: 'group three',
        },
      ]);

    });

  });

  suite('merging global and command arguments', () => {

    test('global and command arguments do not conflict', () => {
      const cli = new cliLib.PolymerCli([]);
      const commands = cli.commands.values();
      const globals = new Map(argsLib.globalArguments.map(
          (a) => [a.name, a] as [string, ArgDescriptor]));

      for (const command of commands) {
        let defaultOption = null;
        for (const arg of command.args) {
          const name = arg.name;
          if (arg.defaultOption) {
            assert.isNull(
                defaultOption,
                `multiple default options for ` +
                    `${command.name}: ${defaultOption} and ${name}`);
            defaultOption = name;
          }
          const globalArg = globals.get(name);
          if (globalArg) {
            for (const prop of Object.keys(arg)) {
              const commandValue = arg[prop as keyof ArgDescriptor];
              const globalValue = globalArg[prop as keyof ArgDescriptor];
              if (globalValue) {
                assert.equal(
                    globalValue,
                    commandValue,
                    `conflicting values for ${command.name} ${name}.${prop}`);
              }
            }
          }
        }
      }
    });

  });

});
