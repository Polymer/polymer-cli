/*
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

import * as chalk from 'chalk';
import * as path from 'path';
import Generator = require('yeoman-generator');

/**
 * Returns a Yeoman Generator constructor that can be passed to yeoman to be
 * run. A "template name" argument is required to choose the correct
 * `/templates` directory name to generate from.
 * (Ex: "polymer-2.x" to generate the `templates/polymer-2x` template directory)
 */
export function createElementGenerator(templateName: string):
    (typeof Generator) {
  return class ElementGenerator extends Generator {
    props: any;

    constructor(args: string|string[], options: any) {
      super(args, options);
      this.sourceRoot(path.join(__dirname, 'templates', templateName));
    }

    // This is necessary to prevent an exception in Yeoman when creating
    // storage for generators registered as a stub and used in a folder
    // with a package.json but with no name property.
    // https://github.com/Polymer/polymer-cli/issues/186
    rootGeneratorName(): string {
      return 'ElementGenerator';
    }

    initializing() {
      // Yeoman replaces dashes with spaces. We want dashes.
      this.appname = this.appname.replace(/\s+/g, '-');
    }

    async prompting(): Promise<void> {
      const prompts = [
        {
          name: 'name',
          type: 'input',
          message: `Element name`,
          default:
              this.appname + (this.appname.includes('-') ? '' : '-element'),
          validate: (name: string) => {
            let nameContainsHyphen = name.includes('-');
            if (!nameContainsHyphen) {
              this.log(
                  '\nUh oh, custom elements must include a hyphen in ' +
                  'their name. Please try again.');
            }
            return nameContainsHyphen;
          },
        },
        {
          type: 'input',
          name: 'description',
          message: 'Brief description of the element',
        },
      ];

      this.props = await this.prompt(prompts);
    }

    writing() {
      const name = this.props.name;

      this.fs.copyTpl(
          `${this.templatePath()}/**/?(.)!(_)*`,
          this.destinationPath(),
          this.props);

      this.fs.copyTpl(
          this.templatePath('_element.html'), `${name}.html`, this.props);

      this.fs.copyTpl(
          this.templatePath('test/_element_test.html'),
          `test/${name}_test.html`,
          this.props);
    }

    install() {
      this.log(chalk.bold('\nProject generated!'));
      this.log('Installing dependencies...');
      this.installDependencies({
        npm: false,
      });
    }

    end() {
      this.log(chalk.bold('\nSetup Complete!'));
      this.log(
          'Check out your new project README for information about what to do next.\n');
    }
  };
}