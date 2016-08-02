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
import * as commandLineCommands from 'command-line-commands';

import {globalArguments} from './args';
import {ArgDescriptor} from './commands/command';
import {BuildCommand} from './commands/build';
import {HelpCommand} from './commands/help';
import {InitCommand} from './commands/init';
import {LintCommand} from './commands/lint';
import {ServeCommand} from './commands/serve';
import {TestCommand} from './commands/test';
import {Command} from './commands/command';
import {ProjectConfig, ProjectConfigOptions} from './project-config';

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

  commands: Map<string, Command> = new Map();
  args: string[];
  defaultConfig: ProjectConfigOptions;

  constructor(args: string[], config?: ProjectConfigOptions) {
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

    if (config) {
      this.defaultConfig = config;
      logger.debug('got default config from constructor argument:', { config: this.defaultConfig });
    } else {
      this.defaultConfig = ProjectConfig.fromConfigFile('polymer.json');
      logger.debug('got default config from file:', { config: this.defaultConfig });
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
    let mergedArgs = new Map<string, ArgDescriptor>();
    let defaultOption: string = null;

    let addAll = (args: ArgDescriptor[]) => {
      for (let definition of args) {
        let name = definition.name;
        let oldDefinition = mergedArgs.get(name);
        if (oldDefinition == null) {
          mergedArgs.set(definition.name, definition);
        } else {
          let mergedDefinition = Object.assign({}, oldDefinition);
          for (let propName of Object.keys(definition)) {
            if (propName === 'name') continue;
            let propValue = definition[propName];
            let oldProp = oldDefinition[propName];
            if (oldProp == null) {
              mergedDefinition[propName] = propValue;
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
    let helpCommand = this.commands.get('help');
    let commandNames = Array.from(this.commands.keys());
    let parsedArgs;
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
        return helpCommand.run({command: error.command}, new ProjectConfig(this.defaultConfig));
      }
      // If an unexpected error occurred, propagate it
      throw error;
    }

    let commandName = parsedArgs.command;
    let commandArgs = parsedArgs.argv;
    let command = this.commands.get(commandName);
    logger.debug(`command '${commandName}' found, parsing command args:`, {args: commandArgs});

    let commandDefinitions = this.mergeDefinitions(command, globalArguments);
    let commandOptionsRaw = commandLineArgs(commandDefinitions, commandArgs);
    let commandOptions = <{ [name: string]: string }>(commandOptionsRaw && commandOptionsRaw['_all']);
    logger.debug(`command options parsed from args:`, commandOptions);

    let config = new ProjectConfig(this.defaultConfig, commandOptions);
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
