/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

// import * as logging from 'plylog';
import {Command, CommandOptions, ProjectConfig} from './command';

// const logger = logging.getLogger('cli.install');

export class InstallCommand implements Command {
  name = 'install';

  description = 'installs Bower dependencies, optionally installing "variants"';

  args = [
    {
      name: 'variants',
      type: Boolean,
      defaultValue: true,
      description: 'Whether to install variants'
    },
  ];

  async run(_options: CommandOptions, _config: ProjectConfig): Promise<void> {
    const install = require('../install/install');
    await (new install.Installer()).install();
  }
}
