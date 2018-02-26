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

import {ArgDescriptor} from 'command-line-args';
import {UsageGroup} from 'command-line-usage';
import {ProjectConfig} from 'polymer-project-config';

import {Command} from './command';

export interface Options {
  rules?: string[];
  input?: string[];
  fix?: boolean;
  edits?: string[];
  prompt: boolean;
  watch?: boolean;
}

export class LintCommand implements Command {
  name = 'lint';
  aliases = [];

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
    },
    {
      name: 'fix',
      type: Boolean,
      description: `Automatically fix as many issues as possible by ` +
          `updating your source on disk.`
    },
    {
      name: 'edits',
      type: String,
      alias: 'e',
      multiple: true,
      description: `The lint edits to apply. Used with --fix. ` +
          `Edits are less-safe fixes. When running in an interactive prompt ` +
          `we will ask whether to apply an edit, but you can automatically ` +
          `apply all edits of a type using this flag, like ` +
          `--edit=content-with-select`
    },
    {
      name: 'prompt',
      type:
          (value: string) => {
            return value.toLowerCase().trim() !== 'false';
          },
      defaultValue: !!process.stdin.isTTY,
      description: `Whether to allow interactive prompts. Use --prompt=false when` +
          ` running as part of an automated script without a human at stdin.`
    },
    {
      name: 'watch',
      type: Boolean,
      alias: 'w',
      defaultValue: false,
      description: `Reruns the linter whenever files change on disk.`
    }
  ];

  /**
   * TODO(rictic): things to make configurable:
   *   - lint warning verbosity
   *   - whether to use color (also: can we autodetect if color is supported?)
   *   - add option for input files to polymer.json
   *   - modules to load that can register new rules
   */

  async run(options: Options, config: ProjectConfig) {
    this._loadPlugins(config);

    // Defer dependency loading until this specific command is run.
    const lintImplementation = await import('../lint/lint');

    return lintImplementation.lint(options, config);
  }

  async extraUsageGroups(config: ProjectConfig): Promise<UsageGroup[]> {
    const lintLib = await import('polymer-linter');
    const chalk = await import('chalk');
    this._loadPlugins(config);
    const collectionsDocs = [];
    for (const collection of lintLib.registry.allRuleCollections) {
      collectionsDocs.push(
          `  ${chalk.bold(collection.code)}: ` +
          `${this._indent(collection.description)}`);
    }
    const rulesDocs = [];
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
