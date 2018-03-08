/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
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

import * as inquirer from 'inquirer';
import * as logging from 'plylog';
import {execSync} from 'mz/child_process';
import {Analyzer, FsUrlLoader, PackageUrlResolver} from 'polymer-analyzer';
import {ProjectConfig} from 'polymer-project-config';
import {execFile, ExecOptions} from 'child_process';
import {CommandResult} from './commands/command';

const logger = logging.getLogger('cli.main');

/**
 * Check if the platform is Windows for platform specific fixes
 */
export function checkIsWindows(): boolean {
  return /^win/.test(process.platform);
}

/**
 * Check if the current shell environment is MinGW. MinGW can't handle some
 * yeoman features, so we can use this check to downgrade gracefully.
 */
function checkIsMinGW(): boolean {
  if (!checkIsWindows()) {
    return false;
  }

  // uname might not exist if using cmd or powershell,
  // which would throw an exception
  try {
    const uname = execSync('uname -s').toString();
    return !!/^mingw/i.test(uname);
  } catch (error) {
    return false;
  }
}

/**
 * A helper function for working with Node's core execFile() method.
 */
export async function exec(command: string, args: string[] = [], cwd: string = process.cwd(), options?: ExecOptions) {
  const commandOptions = {shell: true, ...options, cwd: cwd} as ExecOptions;
  try {
    await new Promise((resolve, reject) => {
      const cmd = execFile(command, args, commandOptions);
      cmd.stdout.pipe(process.stdout);
      cmd.stderr.pipe(process.stderr);

      cmd.on('exit', function (code) {
        logger.debug('child process exited with code ' + code.toString().trim());
        code !== 0 ? reject(code) : resolve(code);
      });
    });

    return new CommandResult(0);
  } catch (err) {
    // If an error happens, attach the working directory to the error object
    err.cwd = cwd;
    logger.debug(err);
    throw new CommandResult(1);
  }
}

/**
 * A wrapper around inquirer prompt that works around its awkward (incorrect?)
 * typings, and is intended for asking a single list-based question.
 */
export async function prompt(
    question: {message: string, choices: inquirer.ChoiceType[]}):
    Promise<string> {
  // Some windows emulators (mingw) don't handle arrows correctly
  // https://github.com/SBoudrias/Inquirer.js/issues/266
  // Fall back to rawlist and use number input
  // Credit to
  // https://gist.github.com/geddski/c42feb364f3c671d22b6390d82b8af8f
  const rawQuestion = {
    type: checkIsMinGW() ? 'rawlist' : 'list',
    name: 'foo',
    message: question.message,
    choices: question.choices,
  };

  const answers = await inquirer.prompt([rawQuestion]);
  return answers.foo;
}

export function indent(str: string, additionalIndentation = '  ') {
  return str.split('\n')
      .map((s) => s ? additionalIndentation + s : '')
      .join('\n');
}

export function dashToCamelCase(text: string): string {
  return text.replace(/-([a-z])/g, (v) => v[1].toUpperCase());
}

export function getConfiguredAnalyzer(config: ProjectConfig) {
  const urlLoader = new FsUrlLoader(config.root);
  const urlResolver = new PackageUrlResolver(
      {packageDir: config.root, componentDir: config.componentDir});

  const analyzer = new Analyzer({
    urlLoader,
    urlResolver,
    moduleResolution: convertModuleResolution(config.moduleResolution)
  });
  return {urlLoader, urlResolver, analyzer};
}

function convertModuleResolution(moduleResolution: 'node'|'none'): 'node'|
    undefined {
  switch (moduleResolution) {
    case 'node':
      return 'node';
    case 'none':
      return undefined;
    default:
      const never: never = moduleResolution;
      throw new Error(`Unknown module resolution parameter: ${never}`);
  }
}
