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
import {Environment} from './environment/environment';
import {buildEnvironment} from './environments/environments';


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
  commands: Map<String, Command> = new Map();
  cli: commandLineCommands.CLI;
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
    this.commandDescriptors.push({
      name: command.name,
      definitions: this.mergeDefinitions(command, globalArguments),
      description: command.description,
    });
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

  run() {
    logger.debug('running...');

    // If the "--version" flag is ever present, just print
    // the current version. Useful for globally installed CLIs.
    if (this.args.indexOf('--version') > -1) {
      console.log(require('../package.json').version);
      return;
    }

    this.cli = commandLineCommands(this.commandDescriptors);
    let cliCommand = this.cli.parse(this.args);
    let commandName = cliCommand.name;
    let commandOptions = <{ [name: string]: string }>(cliCommand.options
      && cliCommand.options['_all']);
    logger.debug('command parsed', { name: commandName, command: cliCommand });
    logger.debug('command options found', { options: commandOptions });

    // When neccessary user input (incl. a sub-command name) is missing,
    // make sure the help command runs as accurately as possible.
    if (!commandName) {
      commandOptions = {};
      commandName = 'help';
    } else if (commandOptions && commandOptions['help']) {
      commandOptions = { command: commandName };
      commandName = 'help';
    }

    let config = new ProjectConfig(this.defaultConfig, commandOptions);
    logger.debug('config merged with command options', config);

    let command = this.commands.get(commandName);
    logger.debug('Running command...');

    command.run(commandOptions, config).catch((error) => {
      console.error('error', error);
      if (error.stack) console.error(error.stack);
    });
  }
}
