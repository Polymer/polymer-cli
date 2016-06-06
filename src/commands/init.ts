/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {Command} from './command';
import {execSync} from 'child_process';
import {ArgDescriptor} from 'command-line-args';
import * as fs from 'fs';
import * as logging from 'plylog';
import * as chalk from 'chalk';
import {ApplicationGenerator} from '../init/application/application';
import {ElementGenerator} from '../init/element/element';
import * as YeomanEnvironment from 'yeoman-environment';

let logger = logging.getLogger('cli.init');

const templateDescriptions = {
  'element': 'A blank element template',
  'application': 'A blank application template',
  'app-drawer-template': 'A starter application template, with navigation and "PRPL pattern" loading',
  'shop': 'The "Shop" Progressive Web App demo',
};

interface GeneratorDescription {
  name: string;
  value: string;
  short: string;
}

export class InitCommand implements Command {
  name = 'init';

  description = 'Initializes a Polymer project';

  args: ArgDescriptor[] = [
    {
      name: 'name',
      description: 'The template name to use to initialize the project',
      type: String,
      defaultOption: true,
    }
  ];

  env: YeomanEnvironment;

  /**
   * Do any pre-run command initialization here. This step is useful for
   * setting up your command and any other expensive loading you don't want
   * to do until absolutely necessary.
   */
  init() {
    // Defer dependency loading until needed
    const YeomanEnvironment = require('yeoman-environment');

    this.env = new YeomanEnvironment();
    registerDefaultGenerators(this.env);
  }

  run(options, config): Promise<any> {
    // Defer dependency loading until needed
    const inquirer = require('inquirer');

    return new Promise((resolve, reject) => {
      logger.debug('creating yeoman environment...');

      this.env.lookup(() => {
        let generators = this.env.getGeneratorsMeta();

        let runGenerator = (generatorName: string, templateName?: string) => {
          let generator = generators[generatorName];
          if (generator) {
            logger.info(`Running template ${templateName || generatorName}`);
            logger.debug(`Running generator ${generatorName}`);
            this.env.run(generatorName, {}, () => resolve());
          } else {
            logger.warn(`Template ${options.name} not found`);
            reject(`Template ${options.name} not found`);
          }
        };

        if (options.name) {
          let generatorName = `polymer-init-${options.name}:app`;
          runGenerator(generatorName, options.name);
        } else {
          let polymerInitGenerators = Object.keys(generators)
              .filter((k) => k.startsWith('polymer-init')
                  && k !== 'polymer-init:app');
          let choices = polymerInitGenerators.map((generatorName: string) => {
            let generator = generators[generatorName];
            return getGeneratorDescription(generator, generatorName);
          });
          // Some windows emulators (mingw) don't handle arrows correctly
          // https://github.com/SBoudrias/Inquirer.js/issues/266
          // Fall back to rawlist and use number input
          // Credit to https://gist.github.com/geddski/c42feb364f3c671d22b6390d82b8af8f
          let isMinGW = checkIsMinGW();
          let prompt = {
            type: isMinGW ? 'rawlist' : 'list',
            name: 'generatorName',
            message: 'Which starter template would you like to use?',
            choices: choices,
          };
          inquirer.prompt([prompt]).then((answers) => {
            let generatorName = answers.generatorName;
            runGenerator(generatorName, getDisplayName(generatorName));
          });
        }
      });
    });
  }
}

function registerDefaultGenerators(env: YeomanEnvironment): void {
  const createGithubGenerator =
    require('../init/github').createGithubGenerator;
  env.registerStub(ElementGenerator, 'polymer-init-element:app');
  env.registerStub(ApplicationGenerator, 'polymer-init-application:app');
  let shopGenerator = createGithubGenerator({
    owner: 'Polymer',
    repo: 'shop',
  });
  env.registerStub(shopGenerator, 'polymer-init-shop:app');
  let appDrawerGenerator = createGithubGenerator({
    owner: 'Polymer',
    repo: 'app-drawer-template',
  });
  env.registerStub(appDrawerGenerator,
    'polymer-init-app-drawer-template:app');
}

function checkIsMinGW(): boolean {
  let isWindows = /^win/.test(process.platform);
  if (isWindows) {
    // uname might not exist if using cmd or powershell,
    // which would throw an exception
    try {
      let uname = execSync('uname -s').toString();
      return !!/^mingw/i.test(uname);
    } catch (e) {
    }
  }
  return false;
}

function getGeneratorDescription(generator: YeomanEnvironment.GeneratorMeta, generatorName: string): GeneratorDescription {
  let description = 'no description';
  let name = getDisplayName(generatorName);

  if (templateDescriptions.hasOwnProperty(name)) {
    description = templateDescriptions[name];
  } else if (generator.resolved && generator.resolved !== 'unknown') {
    let findup = require('findup');
    let metapath = findup('package.json', {cwd: generator.resolved});
    if (metapath) {
      let meta = JSON.parse(fs.readFileSync(metapath, 'utf8'));
      description = meta.description;
    }
  }

  return {
    name: `${name}: ${chalk.dim(description)}`,
    value: generatorName,
    // inquirer is broken and doesn't print descriptions :(
    // keeping this so things work when it does
    short: name,
  };
}

function getDisplayName(generatorName: string) {
  let nameEnd = generatorName.indexOf(':');
  if (nameEnd === -1) nameEnd = generatorName.length;
  return generatorName.substring('polymer-init-'.length, nameEnd);
}

