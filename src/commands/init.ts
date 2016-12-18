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

import {ArgDescriptor} from 'command-line-args';
import * as logging from 'plylog';
import {ProjectConfig} from 'polymer-project-config';
import {Command, CommandOptions} from './command';

let logger = logging.getLogger('cli.command.init');

export class InitCommand implements Command {
  name = 'init';

  description = 'Initializes a Polymer project';

  args: ArgDescriptor[] = [{
    name: 'name',
    description: 'The template name to use to initialize the project',
    type: String,
    defaultOption: true,
  }];

  run(options: CommandOptions, _config: ProjectConfig): Promise<any> {
    // Defer dependency loading until needed
    let polymerInit;
    try {
      polymerInit = require('../init/init');
    } catch (e) {
      return new Promise<void>((_, reject) => {
        reject('Polymer init requires `yeoman-generator` and `yeoman-environment` to be installed globally. Install with `npm install -g yeoman-generator yeoman-environment`');
      });
    }

    const templateName = options['name'];
    if (templateName) {
      const generatorName = `polymer-init-${templateName}:app`;
      logger.debug('template name provided', {
        generator: generatorName,
        template: templateName,
      });
      return polymerInit.runGenerator(generatorName, options);
    }

    logger.debug('no template name provided, prompting user...');
    return polymerInit.promptGeneratorSelection();
  }
}
