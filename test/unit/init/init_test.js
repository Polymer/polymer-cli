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
const sinon = require('sinon');
const helpers = require('yeoman-test');
const childProcess = require('child_process');
const inquirer = require('inquirer');
const YeomanEnvironment = require('yeoman-environment');
const fs = require('fs');
const temp = require('temp').track();

const polymerInit = require('../../../lib/init/init');

var isPlatformWin = /^win/.test(process.platform);

function stripAnsi(str) {
  let ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
  return str.replace(ansiRegex, '');
}

suite('init', () => {
  let sandbox;

  function createFakeEnv() {
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

    test('runs the given generator', () => {
      const GENERATOR_NAME = 'TEST-GENERATOR';
      let yeomanEnv = createFakeEnv();
      yeomanEnv.getGeneratorsMeta.returns({
        [GENERATOR_NAME]: GENERATOR_NAME,
      });

      return polymerInit.runGenerator(GENERATOR_NAME, {env: yeomanEnv}).then(() => {
        assert.isOk(yeomanEnv.run.calledWith(GENERATOR_NAME));
      });
    });

    test('fails if an unknown generator is requested', () => {
      const UNKNOWN_GENERATOR_NAME = 'UNKNOWN-GENERATOR';
      let yeomanEnv = createFakeEnv();
      yeomanEnv.getGeneratorsMeta.returns({
        'TEST-GENERATOR': 'TEST-GENERATOR',
      });

      return polymerInit.runGenerator(UNKNOWN_GENERATOR_NAME, {env: yeomanEnv}).then(() => {
        throw new Error('The promise should have been rejected before it got here');
      }, (error) => {
        assert.equal(error.message, `Template ${UNKNOWN_GENERATOR_NAME} not found`);
      });
    });

    test('works with the default yeoman environment', () => {
      // Note: Do not use a fake Yeoman environment in this test so that we get
      // coverage of the case where env isn't specified.
      const UNKNOWN_GENERATOR_NAME = 'UNKNOWN-GENERATOR';
      return polymerInit.runGenerator(UNKNOWN_GENERATOR_NAME).then(() => {
        throw new Error('The promise should have been rejected before it got here');
      }, (error) => {
        assert.equal(error.message, `Template ${UNKNOWN_GENERATOR_NAME} not found`);
      });
    });

  });

  suite('promptGeneratorSelection', () => {

    let yeomanEnvMock;
    const GENERATORS = [
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
      let generators = {};

      for (let generator of GENERATORS) {
        if (!generator.resolved) {
          let tmpDir = temp.mkdirSync();
          let packageJsonPath = `${tmpDir}/package.json`;
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

    test('works with the default yeoman environment', () => {
      sandbox.stub(inquirer, 'prompt').returns(Promise.resolve({generatorName: 'TEST'}));
      polymerInit.runGenerator = function(name, options) {};
      return polymerInit.promptGeneratorSelection().catch((error) => {
        assert.equal(error.message, 'Template TEST not found');
      });
    });

    test('prompts with a list to get generatorName property from user', () => {
      let promptStub = sandbox.stub(inquirer, 'prompt').returns(Promise.resolve({generatorName: 'TEST'}));
      return polymerInit.promptGeneratorSelection({env: yeomanEnvMock}).catch((error) => {
        assert.equal(error.message, 'Template TEST not found');
      }).then(() => {
        assert.isTrue(promptStub.calledOnce);
        assert.equal(promptStub.firstCall.args[0][0].type, 'list');
        assert.equal(promptStub.firstCall.args[0][0].name, 'generatorName');
        assert.equal(promptStub.firstCall.args[0][0].message,  'Which starter template would you like to use?');
      });
    });

    test('prompts with a list of all registered generators', () => {
      let promptStub = sandbox.stub(inquirer, 'prompt').returns(Promise.resolve({generatorName: 'TEST'}));
      return polymerInit.promptGeneratorSelection({env: yeomanEnvMock}).catch((error) => {
        assert.equal(error.message, 'Template TEST not found');
      }).then(() => {
        let choices = promptStub.firstCall.args[0][0].choices;
        assert.equal(choices.length, GENERATORS.length);

        for (let choice of choices) {
          let generator = GENERATORS.find(generator => generator.generatorName === choice.value);
          assert.isDefined(generator, `generator not found: ${choice.value}`);
          assert.oneOf(stripAnsi(choice.name), [generator.shortName, `${generator.shortName} - ${generator.description}`]);
          assert.equal(choice.value, generator.generatorName);
          assert.equal(choice.short, generator.shortName);
        }
      });
    });

    test('includes user-provided generators in the list when properly installed/registered', () => {
      let yeomanEnv = new YeomanEnvironment();
      let promptStub = sandbox.stub(inquirer, 'prompt').returns(Promise.resolve({generatorName: 'TEST'}));
      helpers.registerDependencies(yeomanEnv, [[helpers.createDummyGenerator(), 'polymer-init-custom-template:app']]);
      return polymerInit.promptGeneratorSelection({env: yeomanEnv}).catch((error) => {
        assert.equal(error.message, 'Template TEST not found');
      }).then(() => {
        assert.isTrue(promptStub.calledOnce);
        let choices = promptStub.firstCall.args[0][0].choices;
        let customGeneratorChoice = choices[choices.length-1];
        assert.equal(stripAnsi(customGeneratorChoice.name), 'custom-template');
        assert.equal(customGeneratorChoice.value, 'polymer-init-custom-template:app');
        assert.equal(customGeneratorChoice.short, 'custom-template');
      });
    });

    test('prompts the user with a list', () => {
      let promptStub = sandbox.stub(inquirer, 'prompt').returns(Promise.resolve({generatorName: 'TEST'}));

      return polymerInit.promptGeneratorSelection({env: yeomanEnvMock}).catch((error) => {
        assert.equal(error.message, 'Template TEST not found');
      }).then(() => {
        assert.isTrue(promptStub.calledOnce);
        assert.equal(promptStub.firstCall.args[0][0].type, 'list');
      });
    });

    if (isPlatformWin) {

      test('prompts with a rawlist if being used in MinGW shell', () => {
        let promptStub = sandbox.stub(inquirer, 'prompt').returns(Promise.resolve({generatorName: 'TEST'}));
        sandbox.stub(childProcess, 'execSync').withArgs('uname -s').returns('mingw');

        return polymerInit.promptGeneratorSelection({env: yeomanEnvMock}).catch((error) => {
          assert.equal(error.message, 'Template TEST not found');
        }).then(() => {
          assert.isTrue(promptStub.calledOnce);
          assert.equal(promptStub.firstCall.args[0][0].type, 'rawlist');
        });
      });

    }

  });

});
