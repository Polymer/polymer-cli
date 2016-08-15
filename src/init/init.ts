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

interface GeneratorDescription {
  name: string;
  value: string;
  short: string;
}

const templateDescriptions = {
  'element': 'A blank element template',
  'application': 'A blank application template',
  'starter-kit': 'A starter application template, with navigation and "PRPL pattern" loading',
  'shop': 'The "Shop" Progressive Web App demo',
};

let shopGenerator = createGithubGenerator({
  owner: 'Polymer',
  repo: 'shop',
});

let pskGenerator = createGithubGenerator({
  owner: 'PolymerElements',
  repo: 'polymer-starter-kit',
});

/**
 * Check if the current shell environment is MinGW. MinGW can't handle some
 * yeoman features, so we can use this check to downgrade gracefully.
 */
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
  } catch (error) {
    logger.debug('`uname -s` failed to execute correctly', {err: error.message});
    return false;
  }
}

/**
 * Get a description for the given generator. If this is an external generator,
 * read the description from its package.json.
 */
function getGeneratorDescription(generator: YeomanEnvironment.GeneratorMeta, generatorName: string): GeneratorDescription {
  let name = getDisplayName(generatorName);
  let description = 'no description';

  if (templateDescriptions.hasOwnProperty(name)) {
    description = templateDescriptions[name];
  } else if (generator.resolved && generator.resolved !== 'unknown') {
    try {
      let metapath = findup.sync(generator.resolved, 'package.json');
      let meta = JSON.parse(fs.readFileSync(metapath, 'utf8'));
      description = meta.description;
    } catch (error) {
      if (error.message === 'not found') {
        logger.debug('no package.json found for generator');
      } else {
        logger.debug('problem reading/parsing package.json for generator', {
          generator: generatorName,
          err: error.message,
        });
      }
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

/**
 * Extract the meaningful name from the full yeoman generator name
 */
function getDisplayName(generatorName: string) {
  let nameEnd = generatorName.indexOf(':');
  if (nameEnd === -1) {
    nameEnd = generatorName.length;
  }
  return generatorName.substring('polymer-init-'.length, nameEnd);
}

/**
 * Create & populate a Yeoman environment.
 */
function createYeomanEnvironment(): Promise<any> {
  return new Promise((resolve, reject) => {
    let env = new YeomanEnvironment();
    env.registerStub(ElementGenerator, 'polymer-init-element:app');
    env.registerStub(ApplicationGenerator, 'polymer-init-application:app');
    env.registerStub(shopGenerator, 'polymer-init-shop:app');
    env.registerStub(pskGenerator, 'polymer-init-starter-kit:app');
    env.lookup((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(env);
    });
  });
}

/**
 * Create the prompt used for selecting which template to run. Generate
 * the list of available generators by filtering relevent ones out from
 * the environment list.
 */
function createSelectPrompt(env): Promise<any> {
  let generators = env.getGeneratorsMeta();
  let polymerInitGenerators = Object.keys(generators).filter((k) => {
    return k.startsWith('polymer-init') && k !== 'polymer-init:app';
  });
  let choices = polymerInitGenerators.map((generatorName: string) => {
    let generator = generators[generatorName];
    return getGeneratorDescription(generator, generatorName);
  });

  // Some windows emulators (mingw) don't handle arrows correctly
  // https://github.com/SBoudrias/Inquirer.js/issues/266
  // Fall back to rawlist and use number input
  // Credit to https://gist.github.com/geddski/c42feb364f3c671d22b6390d82b8af8f
  let isMinGW = checkIsMinGW();

  return {
    type: isMinGW ? 'rawlist' : 'list',
    name: 'generatorName',
    message: 'Which starter template would you like to use?',
    choices: choices,
  };
}

/**
 * Run the given generator. If no Yeoman environment is provided, a new one
 * will be created. If the generator does not exist in the environment, an
 * error will be thrown.
 */
export function runGenerator(generatorName, options): Promise<any> {
  options = options || {};
  let templateName = options.templateName || generatorName;

  return new Promise((resolve, reject) => {
    resolve(options.env || createYeomanEnvironment());
  }).then(function(env) {
    logger.info(`Running template ${templateName}...`);
    logger.debug(`Running generator ${generatorName}...`);
    let generators = env.getGeneratorsMeta();
    let generator = generators[generatorName];

    if (!generator) {
      logger.error(`Template ${templateName} not found`);
      throw new Error(`Template ${templateName} not found`);
    }

    return new Promise((resolve, reject) => {
      env.run(generatorName, {}, (error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });
}

/**
 * Prompt the user to select a generator. When the user
 * selects a generator, run it.
 */
export function promptGeneratorSelection(options): Promise<any> {
  options = options || {};
  let env;

  return new Promise((resolve, reject) => {
    resolve(options.env || createYeomanEnvironment());
  }).then(function(_env) {
    env = _env;
    return inquirer.prompt([createSelectPrompt(env)]);
  }).then(function(answers) {
    let generatorName = answers.generatorName;
    return runGenerator(generatorName, {
      templateName: getDisplayName(generatorName),
      env: env
    });
  });
}
