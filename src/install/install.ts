/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

//// <reference path="../../custom_typings/bower.d.ts" />

import * as bower from 'bower';
import * as logging from 'plylog';
// import * as child_process from 'child_process';

const logger = logging.getLogger('cli.install');

export class Installer {

  install(): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.info('starting install');
      const command = bower.commands.install([], {}, {interactive: true});
      // command.on('log', (data: LogData) => {
      //   console.log(data);
      //   if (data.level === 'conflict') {
      //     console.log(data.data.picks);
      //   }
      // });
      // command.on('prompt', (prompts, callback) => {
      //   // console.log(prompts[0].validate('2\n'));
      //   // console.log('resolved prompt');
      //   // debugger;
      //   callback(null, {prompt: 2});
      // });
      command.on('end', () => {
        resolve();
        logger.info('install complete');
      });
      command.on('error', (err: any) => reject(err));
    });
  }

}
