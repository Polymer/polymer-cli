/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import * as commandLineCommands from 'command-line-commands';
import * as logging from 'plylog';
import {ArgDescriptor} from './commands/command';
import {BuildCommand} from './commands/build';
import {HelpCommand} from './commands/help';
import {InitCommand} from './commands/init';
import {LintCommand} from './commands/lint';
import {ServeCommand} from './commands/serve';
import {TestCommand} from './commands/test';
import {Command} from './commands/command';
import {ProjectConfig, ProjectConfigOptions} from './project-config';
import {Environment} from './environment/environment'
import {buildEnvironment} from './environments/environments'


const logger = logging.getLogger('cli.main');

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught exception: ${error}`);
  if (error.stack) logger.error(error.stack);
});

process.on('unhandledRejection', (error) => {
  logger.error(`Promise rejection: ${error}`);
  if (error.stack) logger.error(error.stack);
});

export class PolymerCli {

  commandDescriptors = [];
  commands : Map<String, Command> = new Map();
  cli: commandLineCommands.CLI;
  args: string[];
  globalArguments: ArgDescriptor[] = [
    {
      name: 'env',
      description: 'The environment to use to specialize certain commands, '
          + 'like build',
      type: function(value): Environment {
        return buildEnvironment(value);
      },
    },
    {
      name: 'entrypoint',
      description: 'The main HTML file that will requested for all routes.',
    },
    {
      name: 'shell',
      type: String,
      description: 'The app shell HTML import',
    },
    {
      name: 'fragment',
      type: String,
      multiple: true,
      description: 'HTML imports that are loaded on-demand.',
    },
    {
      name: 'root',
      type: String,
      description: 'The directory in which to find sources and place build. ' +
          'Defaults to current working directory',
    },
    {
      name: 'verbose',
      description: 'turn on debugging output',
      type: Boolean,
      alias: 'v',
    },
    {
      name: 'quiet',
      description: 'silence output',
      type: Boolean,
      alias: 'q',
    },
  ];

  constructor(args) {
    // If the "--quiet"/"-q" flag is ever present, set our global logging
    // to quiet mode. Also set the level on the logger we've already created.
    if (args.indexOf('--quiet') > -1 || args.indexOf('-q') > -1) {
      logging.setQuiet();
    }

    // If the "--verbose"/"-v" flag is ever present, set our global logging
    // to verbose mode. Also set the level on the logger we've already created.
    if (args.indexOf('--verbose') > -1 || args.indexOf('-v') > -1) {
      logging.setVerbose();
    }

    logger.debug('got args:', { args: args });
    this.args = args;

    this.addCommand(new BuildCommand());
    this.addCommand(new HelpCommand(this.commands));
    this.addCommand(new InitCommand());
    this.addCommand(new LintCommand());
    this.addCommand(new ServeCommand());
    this.addCommand(new TestCommand());
  }

  addCommand(command: Command) {
    logger.debug('adding command', command.name);
    this.commands.set(command.name, command);
    this.commandDescriptors.push({
      name: command.name,
      definitions: this.mergeDefinitions(command, this.globalArguments),
      description: command.description,
    });
  }

  mergeDefinitions(command: Command, globals: ArgDescriptor[]) {
    let mergedArgs = new Map();
    let defaultOption = null;

    let addAll = (args: ArgDescriptor[]) => {
      for (let definition of args) {
        let name = definition.name;
        mergedArgs.set(definition, definition);
        if (mergedArgs.has(name)) {
          throw new Error(`Duplicate argument definition in ${command.name}: ` +
              `${name}`);
        }
        if (defaultOption && definition.defaultOption) {
          throw new Error(`Multiple default arguments in ${command.name}: ` +
              `${defaultOption} and ${name}`);
        }
        defaultOption = name;
      }
    }

    if (command.args) addAll(command.args);
    if (globals) addAll(globals);
    return Array.from(mergedArgs.values());
  }

  run() {
    logger.debug('running...');

    // If the "--version" flag is ever present, just print
    // the current version. Useful for globally installed CLIs.
    if (this.args.indexOf('--version') > -1) {
      console.log(require('../package.json').version);
      return;
    }

    // Alias the "--help"/"-h" flag to run the help command for the given
    // command. This gets us around some limitations in our arguments
    // parsers and keeps us from having to implement additional help logic
    // inside of each command.
    if (this.args.indexOf('--help') > -1 || this.args.indexOf('-h') > -1) {
      this.args = ['help', this.args[0]];
    }

    this.cli = commandLineCommands(this.commandDescriptors);
    let cliCommand = this.cli.parse(this.args);
    logger.debug('command parsed', cliCommand);
    let command = this.commands.get(cliCommand.name || 'help');
    let config = new ProjectConfig('polymer.json', cliCommand.options);

    logger.debug('Running command...');
    command.run(cliCommand.options, config).catch((error) => {
      console.error('error', error);
      if (error.stack) console.error(error.stack);
    });
  }
}
