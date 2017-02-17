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

import * as chalkTypeOnly from 'chalk';
import {ArgDescriptor} from 'command-line-args';
import {UsageGroup} from 'command-line-usage';
import * as lintLibTypeOnly from 'polymer-linter';
import {ProjectConfig} from 'polymer-project-config';
import * as lintImplementationTypeOnly from '../lint/lint';

import {Command} from './command';

export interface Options {
  rules?: string[];
  input?: string[];
}

export class LintCommand implements Command {
  // TODO(rictic): rename to 'lint' here and elsewhere, delete
  // legacy-lint.ts. Also update the README.
  name = 'experimental-lint';

  description = 'Identifies potential errors in your code.';

  args: ArgDescriptor[] = [
    {
      name: 'input',
      type: String,
      alias: 'i',
      defaultOption: true,
      multiple: true,
      description: 'Files to lint. If given, these files will be the only ' +
          'ones linted, otherwise all files in the project will be linted.'
    },
    {
      name: 'rules',
      type: String,
      alias: 'r',
      multiple: true,
      description: 'The lint rules/rule collections to apply. ' +
          'See `polymer help lint` for a list of rules.',
    }
  ];

  /**
   * TODO(rictic): things to make configurable:
   *   - lint warning verbosity
   *   - whether to use color (also: can we autodetect if color is supported?)
   *   - add option for input files to polymer.json
   *   - modules to load that can register new rules
   *   - --watch
   *   - --fix
   */

  async run(options: Options, config: ProjectConfig) {
    this._loadPlugins(config);

    // Defer dependency loading until this specific command is run.
    const lintImplementation: typeof lintImplementationTypeOnly =
        require('../lint/lint');
    return lintImplementation.lint(options, config);
  }

  extraUsageGroups(config: ProjectConfig): UsageGroup[] {
    const lintLib: typeof lintLibTypeOnly = require('polymer-linter');
    const chalk: typeof chalkTypeOnly = require('chalk');
    this._loadPlugins(config);
    let collectionsDocs = [];
    for (const collection of lintLib.registry.allRuleCollections) {
      collectionsDocs.push(`  ${chalk.bold(collection.code)}: ${this._indent(
          collection.description)}`);
    }
    let rulesDocs = [];
    for (const rule of lintLib.registry.allRules) {
      rulesDocs.push(
          `  ${chalk.bold(rule.code)}: ${this._indent(rule.description)}`);
    }
    return [
      {
        header: 'Lint Rule Collections',
        content: collectionsDocs.join('\n\n'),
        raw: true
      },
      {header: 'Lint Rules', content: rulesDocs.join('\n\n'), raw: true}
    ];
  }

  private _indent(description: string) {
    return description.split('\n')
        .map((line, idx) => {
          if (idx === 0) {
            return line;
          }
          if (line.length === 0) {
            return line;
          }
          return '      ' + line;
        })
        .join('\n');
  }

  private _loadPlugins(_config: ProjectConfig) {
    // TODO(rictic): implement.
  }
}
