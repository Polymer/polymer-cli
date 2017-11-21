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
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as inquirer from 'inquirer';
import * as sinon from 'sinon';
import * as tempMod from 'temp';
import * as YeomanEnvironment from 'yeoman-environment';
import * as helpers from 'yeoman-test';

import * as polymerInit from '../../../init/init';
import {invertPromise} from '../../util';

const temp = tempMod.track();


const isPlatformWin = /^win/.test(process.platform);
const uname = childProcess.execSync('uname -s').toString();
const isMinGw = !!/^mingw/i.test(uname);

function stripAnsi(str: string) {
  const ansiRegex =
      /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
  return str.replace(ansiRegex, '');
}

interface FakeEnv {
  getGeneratorsMeta: sinon.SinonStub;
  run: sinon.SinonStub;
}

suite('init', () => {
  let sandbox: sinon.SinonSandbox;

  function createFakeEnv(): FakeEnv {
    return {
      getGeneratorsMeta: sandbox.stub(),
      run: sandbox.stub().yields(),
    };
  }

  setup(() => {
    sandbox = sinon.sandbox.create();
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('runGenerator', () => {

    test('runs the given generator', async () => {
      const GENERATOR_NAME = 'TEST-GENERATOR';
      const yeomanEnv = createFakeEnv();
      yeomanEnv.getGeneratorsMeta.returns({
        [GENERATOR_NAME]: GENERATOR_NAME,
      });

      await polymerInit.runGenerator(GENERATOR_NAME, {env: yeomanEnv});
      assert.isOk(yeomanEnv.run.calledWith(GENERATOR_NAME));
    });

    test('fails if an unknown generator is requested', async () => {
      const UNKNOWN_GENERATOR_NAME = 'UNKNOWN-GENERATOR';
      const yeomanEnv = createFakeEnv();
      yeomanEnv.getGeneratorsMeta.returns({
        'TEST-GENERATOR': 'TEST-GENERATOR',
      });

      const error = await invertPromise(
          polymerInit.runGenerator(UNKNOWN_GENERATOR_NAME, {env: yeomanEnv}));

      assert.equal(
          error.message, `Template ${UNKNOWN_GENERATOR_NAME} not found`);
    });

    test('works with the default yeoman environment', async () => {
      // Note: Do not use a fake Yeoman environment in this test so that we get
      // coverage of the case where env isn't specified.
      const UNKNOWN_GENERATOR_NAME = 'UNKNOWN-GENERATOR';
      const error =
          await invertPromise(polymerInit.runGenerator(UNKNOWN_GENERATOR_NAME));
      assert.equal(
          error.message, `Template ${UNKNOWN_GENERATOR_NAME} not found`);
    });

  });

  suite('promptGeneratorSelection', () => {

    let yeomanEnvMock: FakeEnv;
    interface Generator {
      generatorName: string;
      metaName: string;
      shortName: string;
      description: string;
      resolved?: string;
    }
    const GENERATORS: Generator[] = [
      {
        generatorName: 'polymer-init-element:app',
        metaName: 'polymer-init-element',
        shortName: 'element',
        description: 'A blank element template',
        resolved: 'unknown',
      },
      {
        generatorName: 'polymer-init-my-test-app:app',
        metaName: 'polymer-init-my-test-app',
        shortName: 'my-test-app',
        description: 'my test app',
      },
      {
        generatorName: 'polymer-init-polymer-starter-kit-custom-1:app',
        metaName: 'polymer-init-polymer-starter-kit-1',
        shortName: 'polymer-starter-kit-1',
        description: 'PSK 1',
      },
      {
        generatorName: 'polymer-init-polymer-starter-kit-custom-2:app',
        metaName: 'generator-polymer-init-polymer-starter-kit-2',
        shortName: 'polymer-starter-kit-2',
        description: 'PSK 2',
      },
      {
        generatorName: 'polymer-init-custom-build-1:app',
        metaName: 'generator-polymer-init-custom-build-1',
        shortName: 'custom-build-1',
        description: 'custom build 1',
      },
      {
        generatorName: 'polymer-init-custom-build-2:app',
        metaName: 'polymer-init-custom-build-2',
        shortName: 'custom-build-2',
        description: 'custom build 2',
      },
      {
        generatorName: 'polymer-init-custom-build-3:app',
        metaName: 'custom-build-3',
        shortName: 'custom-build-3',
        description: 'custom build 3',
      },
    ];

    setup(() => {
      const generators: {
        [generatorName: string]:
            {resolved: string|undefined, namespace: string}
      } = {};

      for (const generator of GENERATORS) {
        if (!generator.resolved) {
          const tmpDir = temp.mkdirSync();
          const packageJsonPath = `${tmpDir}/package.json`;
          fs.writeFileSync(packageJsonPath, JSON.stringify({
            description: generator.description,
            name: generator.metaName,
          }));
          generator.resolved = tmpDir;
        }

        generators[generator.generatorName] = {
          resolved: generator.resolved,
          namespace: generator.generatorName,
        };
      }

      yeomanEnvMock = createFakeEnv();
      yeomanEnvMock.getGeneratorsMeta.returns(generators);
    });


    test('works with the default yeoman environment', async () => {
      sandbox.stub(inquirer, 'prompt').returns(Promise.resolve({
        foo: 'TEST',
      }));
      (polymerInit as any).runGenerator = function() {};
      const error = await invertPromise(polymerInit.promptGeneratorSelection());
      assert.equal(error.message, 'Template TEST not found');
    });

    let testName =
        'prompts with a list to get generatorName property from user';
    test(testName, async () => {
      const promptStub = sandbox.stub(inquirer, 'prompt')
                             .returns(Promise.resolve({foo: 'TEST'}));
      try {
        await polymerInit.promptGeneratorSelection({env: yeomanEnvMock});
      } catch (error) {
        assert.equal(error.message, 'Template TEST not found');
      }
      assert.isTrue(promptStub.calledOnce);
      assert.equal(promptStub.firstCall.args[0][0].type, 'list');
      assert.equal(
          promptStub.firstCall.args[0][0].message,
          'Which starter template would you like to use?');
    });

    test('prompts with a list of all registered generators', async () => {
      const promptStub = sandbox.stub(inquirer, 'prompt')
                             .returns(Promise.resolve({foo: 'TEST'}));
      try {
        await polymerInit.promptGeneratorSelection({env: yeomanEnvMock});
      } catch (error) {
        assert.equal(error.message, 'Template TEST not found');
      }
      const choices = promptStub.firstCall.args[0][0].choices;
      assert.equal(choices.length, GENERATORS.length);

      for (const choice of choices) {
        const generator = GENERATORS.find(
            (generator) => generator.generatorName === choice.value)!;
        assert.isDefined(generator, `generator not found: ${choice.value}`);
        assert.oneOf(stripAnsi(choice.name), [
          generator.shortName,
          `${generator.shortName} - ${generator.description}`,
        ]);
        assert.equal(choice.value, generator.generatorName);
        assert.equal(choice.short, generator.shortName);
      }
    });

    testName = 'includes user-provided generators in the list when properly ' +
        'installed/registered';
    test(testName, async () => {
      const yeomanEnv = new YeomanEnvironment();
      const promptStub =
          sandbox.stub(inquirer, 'prompt').returns(Promise.resolve({
            foo: 'TEST',
          }));
      helpers.registerDependencies(yeomanEnv, [[
                                     helpers.createDummyGenerator(),
                                     'polymer-init-custom-template:app',
                                   ]]);
      try {
        await polymerInit.promptGeneratorSelection({env: yeomanEnv});
      } catch (error) {
        assert.equal(error.message, 'Template TEST not found');
      }
      assert.isTrue(promptStub.calledOnce);
      const choices = promptStub.firstCall.args[0][0].choices;
      const customGeneratorChoice = choices[choices.length - 1];
      assert.equal(stripAnsi(customGeneratorChoice.name), 'custom-template');
      assert.equal(
          customGeneratorChoice.value, 'polymer-init-custom-template:app');
      assert.equal(customGeneratorChoice.short, 'custom-template');
    });

    test('prompts the user with a list', async () => {
      const promptStub = sandbox.stub(inquirer, 'prompt')
                             .returns(Promise.resolve({foo: 'TEST'}));

      try {
        await polymerInit.promptGeneratorSelection({env: yeomanEnvMock});
      } catch (error) {
        assert.equal(error.message, 'Template TEST not found');
      }
      assert.isTrue(promptStub.calledOnce);
      assert.equal(promptStub.firstCall.args[0][0].type, 'list');
    });

    if (isPlatformWin && isMinGw) {
      test('prompts with a rawlist if being used in MinGW shell', async () => {
        const promptStub = sandbox.stub(inquirer, 'prompt')
                               .returns(Promise.resolve({foo: 'TEST'}));
        sandbox.stub(childProcess, 'execSync')
            .withArgs('uname -s')
            .returns('mingw');

        try {
          await polymerInit.promptGeneratorSelection({env: yeomanEnvMock});
        } catch (error) {
          assert.equal(error.message, 'Template TEST not found');
        }
        assert.isTrue(promptStub.calledOnce);
        assert.equal(promptStub.firstCall.args[0][0].type, 'rawlist');
      });
    }

  });

});
