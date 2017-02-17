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

import * as commandLineArgs from 'command-line-args';
import * as logging from 'plylog';
import {ProjectConfig} from 'polymer-project-config';

import {Command, CommandOptions} from './command';

const logger = logging.getLogger('cli.lint');

export class LintCommand implements Command {
  name = 'lint';

  description = 'Lints the project';

  args = [
    {
      name: 'input',
      type: String,
      alias: 'i',
      defaultOption: true,
      multiple: true,
      description: 'Files and/or folders to lint. Exclusive. Defaults to cwd.'
    },
    {
      name: 'policy',
      type: String,
      alias: 'p',
      description: 'Your jsconf.json policy file.',
      defaultValue: false
    },
    {
      name: 'config-file',
      type: String,
      defaultValue: 'bower.json',
      description: (
          'If inputs are specified, look for `config-field` in this JSON file.')
    },
    {
      name: 'config-field',
      type: String,
      defaultValue: 'main',
      description:
          ('If config-file is used for inputs, this field determines which ' +
           'file(s) are linted.')
    },
    {
      name: 'follow-dependencies',
      type: Boolean,
      description:
          ('Follow through and lint dependencies. This is default behavior ' +
           'when linting your entire application via the entrypoint, shell, ' +
           'and fragment arguments.')
    },
    {
      name: 'no-follow-dependencies',
      type: Boolean,
      description:
          ('Only lint the files provided, ignoring dependencies. This is ' +
           'default behavior when linting a specific list of files provided ' +
           'via the input argument.')
    }
  ];

  async run(options: CommandOptions, config: ProjectConfig) {
    // Defer dependency loading until this specific command is run
    const polylint = require('polylint/lib/cli');

    let lintFiles: string[] = options['input'];
    if (!lintFiles) {
      lintFiles = [];
      if (config.entrypoint)
        lintFiles.push(config.entrypoint);
      if (config.shell)
        lintFiles.push(config.shell);
      if (config.fragments)
        lintFiles = lintFiles.concat(config.fragments);
      lintFiles = lintFiles.map((p) => p.substring(config.root.length));
    }

    if (lintFiles.length === 0) {
      logger.warn(
          'No inputs specified. Please use the --input, --entrypoint, ' +
          '--shell or --fragment flags');
      let argsCli = commandLineArgs(this.args);
      console.info(argsCli.getUsage({
        title: `polymer ${this.name}`,
        description: this.description,
      }));
      return Promise.resolve();
    }

    // Default to false if input files are provided, otherwise default to true
    let followDependencies = !options['input'];
    if (options['follow-dependencies']) {
      followDependencies = true;
    } else if (options['no-follow-dependencies']) {
      followDependencies = false;
    }

    return polylint
        .runWithOptions({
          input: lintFiles,
          root: config.root,
          // TODO: read into config
          bowerdir: 'bower_components',
          policy: options['policy'],
          'config-file': options['config-file'],
          'config-field': options['config-field'],
          // NOTE: `no-recursion` has the opposite behavior of
          // `follow-dependencies`
          'no-recursion': !followDependencies,
        })
        .then(() => undefined);
  }
}
