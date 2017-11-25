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
import {execSync} from 'mz/child_process';

/**
 * Check if the current shell environment is MinGW. MinGW can't handle some
 * yeoman features, so we can use this check to downgrade gracefully.
 */
function checkIsMinGW(): boolean {
  const isWindows = /^win/.test(process.platform);
  if (!isWindows) {
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

  // TODO(justinfagnani): the typings for inquirer appear wrong
  const answers = await inquirer.prompt([rawQuestion] as any);
  return answers.foo;
}

export function indent(str: string, additionalIndentation = '  ') {
  return str.split('\n')
      .map((s) => s ? additionalIndentation + s : '')
      .join('\n');
}
