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

const polylint = require('polylint/lib/cli');

export class LintCommand implements Command {
  name = 'lint';

  description = 'Lints the project';

  args = [
    {
      name: "policy",
      type: String,
      alias: "p",
      description: "Your jsconf.json policy file.",
      defaultValue: null
    },
    {
      name: "config-file",
      type: String,
      defaultValue: "bower.json",
      description: (
        "If inputs are specified, look for `config-field` in this JSON file."
      )
    },
    {
      name: "config-field",
      type: String,
      defaultValue: "main",
      description: (
        "If config-file is used for inputs, this field determines which " +
        "file(s) are linted."
      )
    },
    {
      name: "no-recursion",
      type: Boolean,
      description: (
        "Only report errors on specified input files, not from their dependencies."
      )
    }
  ];

  run(options, config): Promise<any> {
    return polylint.runWithOptions(options)
        .then(() => null);
  }
}
