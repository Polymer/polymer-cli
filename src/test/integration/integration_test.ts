/*
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt The complete set of authors may be found
 * at http://polymer.github.io/AUTHORS.txt The complete set of contributors may
 * be found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by
 * Google as part of the polymer project is also subject to an additional IP
 * rights grant found at http://polymer.github.io/PATENTS.txt
 */

'use strict';

import * as path from 'path';
import {run as runGenerator} from 'yeoman-test';
import {createApplicationGenerator} from '../../init/application/application';
import {runCommand} from './run-command';
import {createElementGenerator} from '../../init/element/element';
import {createGithubGenerator} from '../../init/github';

// A zero priveledge github token of a nonce account, used for quota.
const githubToken = '8d8622bf09bb1d85cb411b5e475a35e742a7ce35';


suite('integration tests', function() {

  const binPath = path.join(__dirname, '../../../', 'bin', 'polymer.js');

  // Extend timeout limit to 90 seconds for slower systems
  this.timeout(120000);

  suite('init templates', () => {

    // TODO(#562): enable test commands.
    test('test the Polymer 1.x application template', async () => {
      const dir = await runGenerator(createApplicationGenerator('polymer-1.x'))
                      .withPrompts({name: 'my-app'})  // Mock the prompt answers
                      .toPromise();
      await runCommand(binPath, ['install'], {cwd: dir});
      await runCommand(binPath, ['lint'], {cwd: dir});
      await runCommand(binPath, ['test'], {cwd: dir});
      await runCommand(binPath, ['build'], {cwd: dir});
    });

    test('test the Polymer 2.x application template', async () => {
      const dir = await runGenerator(createApplicationGenerator('polymer-2.x'))
                      .withPrompts({name: 'my-app'})  // Mock the prompt answers
                      .toPromise();
      await runCommand(binPath, ['install'], {cwd: dir});
      await runCommand(binPath, ['lint'], {cwd: dir});
      await runCommand(binPath, ['test'], {cwd: dir});
      await runCommand(binPath, ['build'], {cwd: dir});
    });

    test('test the Polymer 2.x "element" template', async () => {
      const dir =
          await runGenerator(createElementGenerator('polymer-2.x'))
              .withPrompts({name: 'my-element'})  // Mock the prompt answers
              .toPromise();
      await runCommand(binPath, ['install'], {cwd: dir});
      await runCommand(binPath, ['lint'], {cwd: dir});
      await runCommand(binPath, ['test'], {cwd: dir});
    });

    test('test the Polymer 1.x "element" template', async () => {
      const dir =
          await runGenerator(createElementGenerator('polymer-1.x'))
              .withPrompts({name: 'my-element'})  // Mock the prompt answers
              .toPromise();
      await runCommand(binPath, ['install'], {cwd: dir});
      await runCommand(binPath, ['lint'], {cwd: dir});
      await runCommand(binPath, ['test'], {cwd: dir});
    });

    test('test the "shop" template', async () => {
      const ShopGenerator = createGithubGenerator({
        owner: 'Polymer',
        repo: 'shop',
        githubToken,
      });

      const dir = await runGenerator(ShopGenerator).toPromise();
      await runCommand(binPath, ['install'], {cwd: dir});
      // See: https://github.com/Polymer/shop/pull/114
      // await runCommand(
      //   binPath, ['lint', '--rules=polymer-2-hybrid'],
      //   {cwd: dir})
      // await runCommand(binPath, ['test'], {cwd: dir})
      await runCommand(binPath, ['build'], {cwd: dir});
    });

    // TODO(justinfagnani): consider removing these integration tests
    // or checking in the contents so that we're not subject to the
    // other repo changing
    test.skip('test the Polymer 1.x "starter-kit" template', async () => {
      const PSKGenerator = createGithubGenerator({
        owner: 'PolymerElements',
        repo: 'polymer-starter-kit',
        semverRange: '^2.0.0',
        githubToken,
      });

      const dir = await runGenerator(PSKGenerator).toPromise();
      await runCommand(binPath, ['install'], {cwd: dir});
      await runCommand(
          binPath, ['lint', '--rules=polymer-2-hybrid'], {cwd: dir});
      // await runCommand(binPath, ['test'], {cwd: dir})
      await runCommand(binPath, ['build'], {cwd: dir});
    });

    // TODO(justinfagnani): consider removing these integration tests
    // or checking in the contents so that we're not subject to the
    // other repo changing
    test.skip('test the Polymer 2.x "starter-kit" template', async () => {
      const PSKGenerator = createGithubGenerator({
        owner: 'PolymerElements',
        repo: 'polymer-starter-kit',
        semverRange: '^3.0.0',
        githubToken,
      });

      const dir = await runGenerator(PSKGenerator).toPromise();
      await runCommand(binPath, ['install'], {cwd: dir});
      await runCommand(binPath, ['lint', '--rules=polymer-2'], {cwd: dir});
      // await runCommand(binPath, ['test'], {cwd: dir}));
      await runCommand(binPath, ['build'], {cwd: dir});
    });


  });

  // TODO(justinfagnani): consider removing these integration tests
  // or checking in the contents so that we're not subject to the
  // other repo changing
  suite.skip('tools-sample-projects templates', () => {

    let tspDir: string;

    suiteSetup(async () => {
      const TSPGenerator = createGithubGenerator({
        owner: 'Polymer',
        repo: 'tools-sample-projects',
        githubToken,
      });

      tspDir = await runGenerator(TSPGenerator).toPromise();
    });

    test('test the "polymer-1-app" template', async () => {
      const dir = path.join(tspDir, 'polymer-1-app');

      await runCommand(binPath, ['install'], {cwd: dir});
      await runCommand(binPath, ['lint'], {cwd: dir});
      // await runCommand(binPath, ['test'], {cwd: dir});
      await runCommand(binPath, ['build'], {cwd: dir});
    });

    test('test the "polymer-2-app" template', async () => {
      const dir = path.join(tspDir, 'polymer-2-app');

      await runCommand(binPath, ['install'], {cwd: dir});
      await runCommand(binPath, ['lint'], {cwd: dir});
      // await runCommand(binPath, ['test'], {cwd: dir})
      await runCommand(binPath, ['build'], {cwd: dir});
    });

  });

});
