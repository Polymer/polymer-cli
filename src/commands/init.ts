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
import {ArgDescriptor} from 'command-line-args';

export class InitCommand implements Command {
  name = 'init';

  description = 'Initializes a Polymer project';

  args: ArgDescriptor[] = [
    {
      name: 'name',
      description: 'The template name',
      type: String,
      defaultOption: true,
    },
  ];

  run(options): Promise<any> {
    // Defer dependency loading until this specific command is run
    const PolykartGenerator = require('../templates/polykart').PolykartGenerator;
    const YeomanEnvironment = require('yeoman-environment');

    return new Promise((resolve, reject) => {
      let templateName = options['name'] || 'polymer-init';
      let env = new YeomanEnvironment();
      env.register(require.resolve('generator-polymer-init'), 'polymer-init:app');
      env.registerStub(PolykartGenerator, 'polykart:app');
      env.run(templateName, {}, () => resolve());
    });
  }
}
