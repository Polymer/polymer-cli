/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import * as logging from 'plylog';
import * as commandLineArgs from 'command-line-args';

import {globalArguments} from './args';
import {ArgDescriptor} from './commands/command';
import {BuildCommand} from './commands/build';
import {HelpCommand} from './commands/help';
import {InitCommand} from './commands/init';
import {LintCommand} from './commands/lint';
import {ServeCommand} from './commands/serve';
import {TestCommand} from './commands/test';
import {Command} from './commands/command';
import {ProjectConfig, ProjectOptions} from 'polymer-project-config';

import commandLineCommands = require('command-line-commands');
import {ParsedCommand} from 'command-line-commands';

const logger = logging.getLogger('cli.main');

process.on('uncaughtException', (error: any) => {
  logger.error(`Uncaught exception: ${error}`);
  if (error.stack) logger.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (error: any) => {
  logger.error(`Promise rejection: ${error}`);
  if (error.stack) logger.error(error.stack);
  process.exit(1);
});

/**
 * CLI arguments are in "hyphen-case" format, but our configuration is in
 * "lowerCamelCase". This helper function converts the special
 * `command-line-args` data format (with its hyphen-case flags) to an easier to
 *  use options object with lowerCamelCase properties.
 */
function parseCLIArgs(commandOptions: any): {[name: string]: string} {
  commandOptions = commandOptions && commandOptions['_all'];
  let parsedOptions = Object.assign({}, commandOptions);

  if (commandOptions['extra-dependencies']) {
    parsedOptions.extraDependencies = commandOptions['extra-dependencies'];
  }

  return parsedOptions;
}


export class PolymerCli {

  commands: Map<string, Command> = new Map();
  args: string[];
  defaultConfigOptions: ProjectOptions;

  constructor(args: string[], configOptions?: ProjectOptions) {
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

    this.args = args;
    logger.debug('got args:', { args: args });

    if (typeof configOptions !== 'undefined') {
      this.defaultConfigOptions = configOptions;
      logger.debug('got default config from constructor argument:', {
        config: this.defaultConfigOptions
      });
    } else {
      this.defaultConfigOptions =
        ProjectConfig.loadOptionsFromFile('polymer.json');
      if (this.defaultConfigOptions) {
        logger.debug('got default config from polymer.json file:', {
          config: this.defaultConfigOptions
        });
      } else {
        logger.debug('no polymer.json file found, no config loaded');
      }
    }

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
  }

  mergeDefinitions(
      command: Command,
      globals: ArgDescriptor[]
      ): ArgDescriptor[] {
    const mergedArgs = new Map<string, ArgDescriptor>();
    let defaultOption: string|null = null;

    const addAll = (args: ArgDescriptor[]) => {
      for (let definition of args) {
        const name = definition.name;
        const oldDefinition = mergedArgs.get(name);
        if (oldDefinition == null) {
          mergedArgs.set(definition.name, definition);
        } else {
          const mergedDefinition = Object.assign({}, oldDefinition);
          for (const propName of Object.keys(definition)) {
            if (propName === 'name') continue;
            const propValue: any = (definition as any)[propName];
            const oldProp = (oldDefinition as any)[propName];
            if (oldProp == null) {
              (mergedDefinition as any)[propName] = propValue;
            } else {
              throw new Error(
                `duplicate argument definition in ${command.name}: ${name}.${propName}`);
            }
          }
          mergedArgs.set(name, mergedDefinition);
          definition = mergedDefinition;
        }
        if (definition.defaultOption) {
          if (defaultOption && defaultOption !== name) {
            throw new Error(`Multiple default arguments in ${command.name}: ` +
                `${defaultOption} and ${name}`);
          }
          defaultOption = name;
        }
      }
    };

    if (globals) addAll(globals);
    if (command.args) addAll(command.args);
    return Array.from(mergedArgs.values());
  }

  run(): Promise<any> {
    const helpCommand = this.commands.get('help')!;
    const commandNames = Array.from(this.commands.keys());
    let parsedArgs: ParsedCommand;
    logger.debug('running...');

    // If the "--version" flag is ever present, just print
    // the current version. Useful for globally installed CLIs.
    if (this.args.indexOf('--version') > -1) {
      console.log(require('../package.json').version);
      return Promise.resolve();
    }

    try {
      parsedArgs = commandLineCommands(commandNames, this.args);
    } catch (error) {
      // Polymer CLI needs a valid command name to do anything. If the given
      // command is invalid, run the generalized help command with default
      // config. This should print the general usage information.
      if (error.name === 'INVALID_COMMAND') {
        if (error.command) {
          logger.warn(`'${error.command}' is not an available command.`);
        }
        return helpCommand.run({command: error.command}, new ProjectConfig(this.defaultConfigOptions));
      }
      // If an unexpected error occurred, propagate it
      throw error;
    }

    const commandName = parsedArgs.command;
    const commandArgs = parsedArgs.argv;
    const command = this.commands.get(commandName)!;
    if (command == null) throw new TypeError('command is null');

    logger.debug(`command '${commandName}' found, parsing command args:`, {args: commandArgs});

    const commandDefinitions = this.mergeDefinitions(command, globalArguments);
    const commandOptionsRaw = commandLineArgs(commandDefinitions, commandArgs);
    const commandOptions = parseCLIArgs(commandOptionsRaw);
    logger.debug(`command options parsed from args:`, commandOptions);

    const mergedConfigOptions = Object.assign(
      {}, this.defaultConfigOptions, commandOptions);

    const config = new ProjectConfig(mergedConfigOptions);
    logger.debug(`final project configuration generated:`, config);

    // Help is a special argument for displaying help for the given command.
    // If found, run the help command instead, with the given command name as
    // an option.
    if (commandOptions['help']) {
      logger.debug(`'--help' option found, running 'help' for given command...`);
      return helpCommand.run({ command: commandName }, config);
    }

    logger.debug('Running command...');
    return command.run(commandOptions, config);
  }
}
