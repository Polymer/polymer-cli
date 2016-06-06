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
import * as logging from 'plylog';

let logger = logging.getLogger('cli.command.init');

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

  run(options, config): Promise<any> {
    // Defer dependency loading until needed
    const polymerInit = require('../init/init');

    if (options.name) {
      let templateName = options.name;
      let generatorName = `polymer-init-${templateName}:app`;
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

