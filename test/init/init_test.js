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

const polymerInit = require('../../lib/init/init');

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

  });

  suite('promptGeneratorSelection', () => {

    let yeomanEnvMock;

    setup(() => {
      yeomanEnvMock = createFakeEnv();
      yeomanEnvMock.getGeneratorsMeta.returns({
        'polymer-init-element:app': {
          resolved: 'unknown',
          namespace: 'polymer-init-element:app',
        },
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
        assert.equal(choices.length, 1);
        assert.equal(stripAnsi(choices[0].name), 'element: A blank element template');
        assert.equal(choices[0].value, 'polymer-init-element:app');
        assert.equal(choices[0].short, 'element');
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
        assert.equal(stripAnsi(customGeneratorChoice.name), 'custom-template: no description');
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
