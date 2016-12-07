/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import * as chalk from 'chalk';
import {execSync} from 'child_process';
import * as fs from 'fs';
import * as logging from 'plylog';

import findup = require('findup-sync');
import {ApplicationGenerator} from '../init/application/application';
import {ElementGenerator} from '../init/element/element';
import * as YeomanEnvironment from 'yeoman-environment';
import {prompt, Question as InquirerQuestion} from 'inquirer';
import {createGithubGenerator} from '../init/github';

// import {Base} from 'yeoman-generator';


const logger = logging.getLogger('init');

interface GeneratorDescription {
  name: string;
  value: string;
  short: string;
}

const templateDescriptions: {[name: string]: string} = {
  'element': 'A blank element template',
  'application': 'A blank application template',
  'starter-kit':
      'A starter application template, with navigation and "PRPL pattern" loading',
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
    logger.debug(
        '`uname -s` failed to execute correctly', {err: error.message});
    return false;
  }
}

/**
 * Get a description for the given generator. If this is an external generator,
 * read the description from its package.json.
 */
function getGeneratorDescription(
    generator: YeomanEnvironment.GeneratorMeta,
    generatorName: string): GeneratorDescription {
  const name = getDisplayName(generatorName);
  let description: string = '';

  if (templateDescriptions.hasOwnProperty(name)) {
    description = templateDescriptions[name];
  } else if (generator.resolved && generator.resolved !== 'unknown') {
    try {
      const metapath = findup('package.json', {cwd: generator.resolved});
      const meta = JSON.parse(fs.readFileSync(metapath, 'utf8'));
      description = meta.description;
    } catch (error) {
      if (error.message === 'not found') {
        logger.debug('no package.json found for generator');
      } else {
        logger.debug('unable to read/parse package.json for generator', {
          generator: generatorName,
          err: error.message,
        });
      }
    }
  }
  // If a description exists, format it properly for the command-line
  if (description.length > 0) {
    description = chalk.dim(` - ${description}`);
  }

  return {
    name: `${name}${description}`,
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
    const env = new YeomanEnvironment();
    env.registerStub(ElementGenerator, 'polymer-init-element:app');
    env.registerStub(ApplicationGenerator, 'polymer-init-application:app');
    env.registerStub(shopGenerator, 'polymer-init-shop:app');
    env.registerStub(pskGenerator, 'polymer-init-starter-kit:app');
    env.lookup((error?: Error) => {
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
function createSelectPrompt(env: YeomanEnvironment): InquirerQuestion {
  const generators = env.getGeneratorsMeta();
  const polymerInitGenerators = Object.keys(generators).filter((k) => {
    return k.startsWith('polymer-init') && k !== 'polymer-init:app';
  });
  const choices = polymerInitGenerators.map((generatorName: string) => {
    const generator = generators[generatorName];
    return getGeneratorDescription(generator, generatorName);
  });

  // Some windows emulators (mingw) don't handle arrows correctly
  // https://github.com/SBoudrias/Inquirer.js/issues/266
  // Fall back to rawlist and use number input
  // Credit to https://gist.github.com/geddski/c42feb364f3c671d22b6390d82b8af8f
  const isMinGW = checkIsMinGW();

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
export async function runGenerator(
    generatorName: string, options: {[name: string]: any}): Promise<void> {
  options = options || {};
  const templateName = options['templateName'] || generatorName;

  const env: YeomanEnvironment =
      await(options['env'] || createYeomanEnvironment());

  logger.info(`Running template ${templateName}...`);
  logger.debug(`Running generator ${generatorName}...`);
  const generators = env.getGeneratorsMeta();
  const generator = generators[generatorName];

  if (!generator) {
    logger.error(`Template ${templateName} not found`);
    throw new Error(`Template ${templateName} not found`);
  }

  return new Promise<void>((resolve, reject) => {
    env.run(generatorName, {}, (error: any) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

/**
 * Prompt the user to select a generator. When the user
 * selects a generator, run it.
 */
export async function promptGeneratorSelection(options: {[name: string]: any}):
    Promise<void> {
  options = options || {};
  const env = await(options['env'] || createYeomanEnvironment());
  // TODO(justinfagnani): the typings for inquirer appear wrong
  const answers = await(prompt([createSelectPrompt(env)]) as any);
  const generatorName = answers['generatorName'];
  await runGenerator(
      generatorName, {templateName: getDisplayName(generatorName), env: env});
}
