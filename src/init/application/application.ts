/*
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import * as chalk from 'chalk';
import * as path from 'path';
import {Base} from 'yeoman-generator';

export class ApplicationGenerator extends Base {

  props: any;

  constructor(args: string | string[], options: any) {
    super(args, options);
    this.sourceRoot(path.join(__dirname, 'templates'));
  }

  initializing() {
    // Yeoman replaces dashes with spaces. We want dashes.
    this.appname = this.appname.replace(/\s+/g, '-');
  }

  prompting() {
    let _this = this;

    let prompts = [
      {
        name: 'name',
        type: 'input',
        message: `Application name`,
        default: this.appname,
      },
      {
        type: 'input',
        name: 'elementName',
        message: `Main element name`,
        default: (answers) => `${answers.name}-app`,
        validate(name) {
          let nameContainsHyphen = name.includes('-');
          if (!nameContainsHyphen) {
            _this.log('\nUh oh, custom elements must include a hyphen in '
              + 'their name. Please try again.');
          }
          return nameContainsHyphen;
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'Brief description of the application',
      },
    ];

    // typings is out of date
    return (<any>this).prompt(prompts).then((props) => {
      this.props = props;
    });
  }

  writing() {
    let elementName = this.props.elementName;

    this.fs.copyTpl(
      `${this.templatePath()}/**/?(.)!(_)*`,
      this.destinationPath(),
      this.props);

    this.fs.copyTpl(
      this.templatePath('src/_element/_element.html'),
      `src/${elementName}/${elementName}.html`,
      this.props);

    this.fs.copyTpl(
      this.templatePath('test/_element/_element_test.html'),
      `test/${elementName}/${elementName}_test.html`,
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
    this.log('Check out your new project README for information about what to do next.\n');
  }
}
