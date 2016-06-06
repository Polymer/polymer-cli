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
const PolymerCli = require('../../lib/polymer-cli').PolymerCli;
const childProcess = require('child_process');
const inquirer = require('inquirer');

var isPlatformWin = /^win/.test(process.platform);

suite('init', () => {
  let sandbox;
  let cli;
  let initCommand;

  setup(() => {
    sandbox = sinon.sandbox.create();
    cli = new PolymerCli(['init']);
    initCommand = cli.commands.get('init');
  });

  teardown(() => {
    sandbox.restore();
  });

  test('calls ', () => {
    let registeredGenerators = initCommand.env.getGeneratorsMeta();
    assert.deepEqual(registeredGenerators, {
      'polymer-init-element:app': {
        resolved: 'unknown',
        namespace: 'polymer-init-element:app',
      },
      'polymer-init-application:app': {
        resolved: 'unknown',
        namespace: 'polymer-init-application:app',
      },
      'polymer-init-shop:app': {
        resolved: 'unknown',
        namespace: 'polymer-init-shop:app',
      },
      'polymer-init-app-drawer-template:app': {
        resolved: 'unknown',
        namespace: 'polymer-init-app-drawer-template:app',
      },
    });
  });

  test('prompts with a list of all registered generators', (done) => {
    let promptStub = sandbox.stub(inquirer, 'prompt').returns(new Promise(function() {}));
    cli.run().then(() => {
      assert.isTrue(promptStub.calledOnce);
      assert.isTrue(promptStub.calledWith([
        {
          "type":"list",
          "name":"generatorName",
          "message":"Which starter template would you like to use?",
          "choices":[
            {
              "name":"element: \u001b[2mA blank element template\u001b[22m",
              "value":"polymer-init-element:app",
              "short":"element",
            },
            {
              "name":"application: \u001b[2mA blank application template\u001b[22m",
              "value":"polymer-init-application:app",
              "short":"application",
            },
            {
              "name":"shop: \u001b[2mThe \"Shop\" Progressive Web App demo\u001b[22m",
              "value":"polymer-init-shop:app",
              "short":"shop",
            },
            {
              "name":"app-drawer-template: \u001b[2mA starter application template, with navigation and \"PRPL pattern\" loading\u001b[22m",
              "value":"polymer-init-app-drawer-template:app",
              "short":"app-drawer-template",
            },
          ],
        },
      ]));
      done();
    });
  });

  test('includes user-provided generators in the list when properly installed/registered', () => {
    let promptStub = sandbox.stub(inquirer, 'prompt').returns(new Promise(function() {}));
    helpers.registerDependencies(initCommand.env, [[helpers.createDummyGenerator(), 'polymer-init-custom-template:app']]);
    initCommand.run({});

    assert.isTrue(promptStub.calledOnce);
    assert.isTrue(promptStub.calledWith([
      {
        "type":"list",
        "name":"generatorName",
        "message":"Which starter template would you like to use?",
        "choices":[
          {
            "name":"element: \u001b[2mA blank element template\u001b[22m",
            "value":"polymer-init-element:app",
            "short":"element",
          },
          {
            "name":"application: \u001b[2mA blank application template\u001b[22m",
            "value":"polymer-init-application:app",
            "short":"application",
          },
          {
            "name":"shop: \u001b[2mThe \"Shop\" Progressive Web App demo\u001b[22m",
            "value":"polymer-init-shop:app",
            "short":"shop",
          },
          {
            "name":"app-drawer-template: \u001b[2mA starter application template, with navigation and \"PRPL pattern\" loading\u001b[22m",
            "value":"polymer-init-app-drawer-template:app",
            "short":"app-drawer-template",
          },
          {
            name: 'custom-template: \u001b[2mno description\u001b[22m',
            value: 'polymer-init-custom-template:app',
            short: 'custom-template',
          },
        ],
      },
    ]));
  });

  if (isPlatformWin) {

    test('prompts with a rawlist if being used in MinGW shell', () => {
      let promptStub = sandbox.stub(inquirer, 'prompt').returns(new Promise(function() {}));
      sandbox.stub(childProcess, 'execSync').withExactArgs('uname -s').returns('mingw');
      cli.run();

      assert.isTrue(promptStub.calledWith([
        {
          "type":"rawlist",
          "name":"generatorName",
          "message":"Which starter template would you like to use?",
          "choices":[
            {
              "name":"element: \u001b[2mA blank element template\u001b[22m",
              "value":"polymer-init-element:app",
              "short":"element",
            },
            {
              "name":"application: \u001b[2mA blank application template\u001b[22m",
              "value":"polymer-init-application:app",
              "short":"application",
            },
            {
              "name":"shop: \u001b[2mThe \"Shop\" Progressive Web App demo\u001b[22m",
              "value":"polymer-init-shop:app",
              "short":"shop",
            },
            {
              "name":"app-drawer-template: \u001b[2mA starter application template, with navigation and \"PRPL pattern\" loading\u001b[22m",
              "value":"polymer-init-app-drawer-template:app",
              "short":"app-drawer-template",
            },
          ],
        },
      ]));
    });

  }

  test('allows a generator to be be specified', () => {
    let runStub = sandbox.stub(initCommand.env, 'run').returns(Promise.resolve());
    let promptStub = sandbox.stub(inquirer, 'prompt').returns(new Promise(function() {}));

    initCommand.run({name: 'shop'});
    assert.isTrue(runStub.calledOnce);
    assert.isTrue(runStub.calledWith('polymer-init-shop:app'));
    //Make sure we never prompted, we just ran with it
    assert.isFalse(promptStub.called);
  });

  test('fails if an unknown generator is requested', (done) => {
    let unknownGeneratorName = 'UNKNOWN-GENERATOR';

    initCommand.run({name: unknownGeneratorName}).then(() => {
      done('The promise should have been rejected');
    }, (err) => {
      assert.equal(err, `Template ${unknownGeneratorName} not found`);
      done();
    }).catch(done); // to catch the assertion error
  });

});
