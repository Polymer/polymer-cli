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
const mockery = require('mockery');
const sinon = require('sinon');

const match = sinon.match;

suite('init', () => {
  let InitCommand;
  let sandbox;
  let originalPlatform;
  let execStub;
  let yeomanEnvStub;
  let inquirerStub;
  let elementGeneratorStub;
  let applicationGeneratorStub;

  setup(() => {
    sandbox = sinon.sandbox.create();
    originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
    mockery.enable({useCleanCache: true});
    mockery.registerAllowables(['../../lib/commands/init']);
    mockDependencies();
    //We need to re-import this each time mockery gets set up
    // so that we have fresh stubs/spies
    InitCommand = require('../../lib/commands/init').InitCommand
  });

  teardown(() => {
    sandbox.restore();
    Object.defineProperty(process, 'platform', originalPlatform);
    mockery.disable();
  });

  function stubInquirer(generatorName) {
    inquirerStub.prompt.returns(Promise.resolve({
      generatorName: generatorName,
    }))
  }

  test('registers default template generators', () => {
    let registeredGens = {};
    let registerSpy = sandbox.spy(function (gen, name) {
      registeredGens[name] = gen;
    });
    yeomanEnvStub.prototype.registerStub = registerSpy;

    yeomanEnvStub.prototype.getGeneratorsMeta.returns(registeredGens);
    stubInquirer('polymer-init-element:app');

    return new InitCommand().run({}, {})
      .then(() => {
        assert.isTrue(registerSpy.calledWith(
          match.same(elementGeneratorStub.ElementGenerator),
          'polymer-init-element:app'
        ));

        assert.isTrue(registerSpy.calledWith(
          match.same(applicationGeneratorStub.ApplicationGenerator),
          'polymer-init-application:app'
        ));

        assert.isTrue(registerSpy.calledWith(
          {
            owner: 'Polymer', repo: 'shop',
          },
          'polymer-init-shop:app')
        );

        assert.isTrue(registerSpy.calledWith(
          {
            owner: 'Polymer', repo: 'app-drawer-template',
          },
          'polymer-init-app-drawer-template:app'
        ));

        assert.isTrue(inquirerStub.prompt.calledWithMatch(match(function (value) {
          assert.sameDeepMembers(
            value[0].choices,
            [
              {
                name: 'element: A blank element template',
                value: 'polymer-init-element:app',
                short: 'element',
              },
              {
                name: 'application: A blank application template',
                value: 'polymer-init-application:app',
                short: 'application',
              },
              {
                name: 'shop: The "Shop" Progressive Web App demo',
                value: 'polymer-init-shop:app',
                short: 'shop',
              },
              {
                name: 'app-drawer-template: A starter application template, ' +
                'with navigation and "PRPL pattern" loading',
                value: 'polymer-init-app-drawer-template:app',
                short: 'app-drawer-template',
              },
            ]
          );
          return true;
        })));
      });
  });

  test('prompts with a list of all registered generators', () => {
    mockPlatform('linux');
    yeomanEnvStub.prototype.getGeneratorsMeta.returns({
      'polymer-init-foo:app': {},
      'polymer-init-bar:app': {},
    });
    stubInquirer('polymer-init-foo:app');

    return new InitCommand().run({}, {})
      .then(() => {
        assert.isTrue(inquirerStub.prompt.calledWith([
          {
            type: 'list',
            name: 'generatorName',
            message: 'Which starter template would you like to use?',
            choices: [
              {
                "name": "foo: no description",
                "value": "polymer-init-foo:app",
                "short": "foo",
              },
              {
                "name": "bar: no description",
                "value": "polymer-init-bar:app",
                "short": "bar",
              },
            ],
          },
        ]));
      });
  });

  test('prompts with a rawlist if being used in MinGW shell', () => {
    mockPlatform('windows');
    execStub.execSync.returns('mingw');

    yeomanEnvStub.prototype.getGeneratorsMeta.returns({
      'polymer-init-foo:app': {},
      'polymer-init-bar:app': {},
    });
    stubInquirer('polymer-init-foo:app');

    return new InitCommand().run({}, {})
      .then(() => {
        assert.isTrue(inquirerStub.prompt.calledWith(match((value) => {
          return value[0].type === 'rawlist';
        }, 'prompt type must be rawlist')));
      });
  });

  test('allows a generator to be be specified', () => {
    yeomanEnvStub.prototype.getGeneratorsMeta.returns({
      'polymer-init-test:app': {},
    });

    let run = new InitCommand().run({name: 'test'}, {});

    return run.then(() => {
      let runStub = yeomanEnvStub.prototype.run;

      assert.isTrue(runStub.calledWith('polymer-init-test:app'));
      assert.isTrue(runStub.calledOnce);

      //Make sure we never prompted, we just ran with it
      assert.isFalse(inquirerStub.prompt.called);
    })
  });

  test('fails if an unknown generator is requested', (done) => {
    yeomanEnvStub.prototype.getGeneratorsMeta.returns({
      'polymer-init-test:app': {},
    });

    let run = new InitCommand().run({name: 'fake'}, {});

    run.then(function () {
      done('The promise should have been rejected');
    }, function (err) {
      assert.equal(err, 'Template fake not found');
      done();
    }).catch(done);//to catch the assertion error
  });

  //TODO(ThatJoeMoore): pending as part of #177
  test('detects and prompts with custom generators');

  function mockPlatform(platform) {
    Object.defineProperty(process, 'platform', {
      value: platform,
    });
  }

  function mockDependencies() {
    execStub = registerMock('child_process', {
      execSync: sandbox.stub(),
    });

    registerMock('fs', {
      readFileSync: sandbox.stub(),
    });

    registerMock('chalk', {
      dim: sandbox.stub().returnsArg(0),
    });

    //This fails with arrow functions
    //  (arrow functions don't have an accessible prototype)
    yeomanEnvStub = registerMock('yeoman-environment', function() {});
    yeomanEnvStub.prototype.registerStub = sandbox.stub();
    yeomanEnvStub.prototype.lookup = sandbox.stub().yields();
    yeomanEnvStub.prototype.run = sandbox.stub().yields();
    yeomanEnvStub.prototype.getGeneratorsMeta = sandbox.stub();

    registerMock('findup', {
      sync: sandbox.stub(),
    });

    inquirerStub = registerMock('inquirer', {
      prompt: sandbox.stub().returns(Promise.resolve()),
    });

    registerMock('../init/github', {
      createGithubGenerator: sandbox.stub().returnsArg(0),
    });

    registerMock('plylog', {
      getLogger: () => {
        return {
          info: sandbox.spy(),
          debug: sandbox.spy(),
          warn: sandbox.spy(),
        }
      },
    });

    elementGeneratorStub = registerMock(
      '../init/element/element', {ElementGenerator: {}}
    );
    applicationGeneratorStub = registerMock(
      '../init/application/application', {ApplicationGenerator: {}}
    );
  }

  function registerMock(name, obj) {
    mockery.registerMock(name, obj);
    return obj;
  }

});
