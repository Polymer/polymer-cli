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

import {Command, CommandOptions} from './command';

export class AnalyzeCommand implements Command {
  name = 'analyze';
  aliases = [];

  description = 'Writes analysis metadata in JSON format to standard out';

  args = [{
    name: 'input',
    alias: 'i',
    description:
        'The files to analyze, or none to analyze the current directory as a package',
    defaultOption: true,
    multiple: true,
  }];

  async run(options: CommandOptions, config: ProjectConfig) {
    const {analyze} = await import('../analyze/analyze');
    const metadata = await analyze(config, options.input);
    process.stdout.write(JSON.stringify(metadata, null, 2));
    process.stdout.write('\n');
  }
}
