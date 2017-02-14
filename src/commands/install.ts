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

// Be careful with these imports. As much as possible should be deferred until
// the command is actually run, in order to minimize startup time from loading
// unused code. Any imports that are only used as types will be removed from the
// output JS and so not result in a require() statement.

import {ProjectConfig} from 'polymer-project-config';

import {install as installTypeOnly} from '../install/install';

import {Command, CommandOptions} from './command';

export class InstallCommand implements Command {
  name = 'install';

  // TODO(justinfagnani): Expand and link to eventual doc on variants.
  description = 'installs Bower dependencies, optionally installing "variants"';

  args = [
    {
      name: 'variants',
      type: Boolean,
      defaultValue: false,
      description: 'Whether to install variants'
    },
    {
      name: 'offline',
      type: Boolean,
      defaultValue: false,
      description: 'Don\'t hit the network'
    },
  ];

  async run(options: CommandOptions, _config: ProjectConfig): Promise<void> {
    // Defer dependency loading until this specific command is run
    const install =
        require('../install/install').install as typeof installTypeOnly;
    await install(options);
  }
}
