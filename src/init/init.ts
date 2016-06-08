/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {execSync} from 'child_process';
import * as fs from 'fs';
import * as logging from 'plylog';
import * as chalk from 'chalk';
import * as findup from 'findup';
import {ApplicationGenerator} from '../init/application/application';
import {ElementGenerator} from '../init/element/element';
import * as YeomanEnvironment from 'yeoman-environment';
import * as inquirer from 'inquirer';
import {createGithubGenerator} from '../init/github';

let logger = logging.getLogger('init');

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

let shopGenerator = createGithubGenerator({
  owner: 'Polymer',
  repo: 'shop',
});

let appDrawerGenerator = createGithubGenerator({
  owner: 'Polymer',
  repo: 'app-drawer-template',
});

function checkIsMinGW(): boolean {
  let isWindows = /^win/.test(process.platform);
  if (!isWindows) {
    return false;
  }

  // uname might not exist if using cmd or powershell,
  // which would throw an exception
  try {
    let uname = execSync('uname -s').toString();
    return !!/^mingw/i.test(uname);
  } catch (err) {
    logger.debug('`uname -s` failed to execute correctly', {err: err.message});
    return false;
  }
}

function getGeneratorDescription(generator: YeomanEnvironment.GeneratorMeta, generatorName: string): GeneratorDescription {
  let name = getDisplayName(generatorName);
  let description;

  if (templateDescriptions.hasOwnProperty(name)) {
    description = templateDescriptions[name];
  } else if (generator.resolved && generator.resolved !== 'unknown') {
    try {
      let metapath = findup.sync(generator.resolved, 'package.json');
      let meta = JSON.parse(fs.readFileSync(metapath, 'utf8'));
      description = meta.description;
    } catch (err) {
      if (err.message === 'not found') {
        logger.debug('no package.json found for generator');
      } else {
        logger.debug('problem reading/parsing package.json for generator', {
          generator: generatorName,
          err: err.message,
        });
      }
      description = '';
    }
  }

  return {
    name: `${name}  ${chalk.dim(description)}`,
    value: generatorName,
    // inquirer is broken and doesn't print descriptions :(
    // keeping this so things work when it does
    short: name,
  };
}

function getDisplayName(generatorName: string) {
  let nameEnd = generatorName.indexOf(':');
  if (nameEnd === -1) {
    nameEnd = generatorName.length;
  }
  return generatorName.substring('polymer-init-'.length, nameEnd);
}

export function createYeomanEnvironment(): Promise<any> {
  return new Promise((resolve, reject) => {
    let env = new YeomanEnvironment();
    env.registerStub(ElementGenerator, 'polymer-init-element:app');
    env.registerStub(ApplicationGenerator, 'polymer-init-application:app');
    env.registerStub(shopGenerator, 'polymer-init-shop:app');
    env.registerStub(appDrawerGenerator, 'polymer-init-app-drawer-template:app');
    env.lookup((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(env);
    });
  });
}

export function runGenerator(generatorName, options): Promise<any> {
  options = options || {};
  let templateName = options.templateName || generatorName;

  return new Promise((resolve, reject) => {
    resolve(options.env || createYeomanEnvironment());
  }).then(function(env) {
    let generators = env.getGeneratorsMeta();
    let generator = generators[generatorName];
    if (!generator) {
      logger.error(`Template ${templateName} not found`);
      throw new Error(`Template ${templateName} not found`);
    }

    logger.info(`Running template ${options.templateName || generatorName}`);
    logger.debug(`Running generator ${generatorName}`);
    return new Promise((resolve, reject) => {
      env.run(generatorName, {}, () => resolve());
    });
  });
}

export function promptGeneratorSelection(options): Promise<any> {
  options = options || {};

  return new Promise((resolve, reject) => {
    resolve(options.env || createYeomanEnvironment());
  }).then(function(env) {
    let generators = env.getGeneratorsMeta();
    let polymerInitGenerators = Object.keys(generators)
      .filter((k) => k.startsWith('polymer-init') && k !== 'polymer-init:app');
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

    return inquirer.prompt([prompt]).then((answers) => {
      let generatorName = answers.generatorName;
      return runGenerator(generatorName, {
        templateName: getDisplayName(generatorName),
        env: env
      });
    });
  });
}



