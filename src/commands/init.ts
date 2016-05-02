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

// not ES modules compatible
const YeomanEnvironment = require('yeoman-environment');
const polymerGenerator = require('generator-polymer-init');

export class InitCommand implements Command {
  name = 'init';

  description = 'Initializes a Polymer project';

  args = [];

  run(options): Promise<any> {
    return new Promise((resolve, reject) => {
      let env = new YeomanEnvironment();
      // Can't use registerStub here because Yeoman sets the wrong template path
      // inside the generator.
      env.register(require.resolve('generator-polymer-init'), 'polymer-init:app');
      env.run('polymer-init', {}, () => resolve());
    });
  }
}
