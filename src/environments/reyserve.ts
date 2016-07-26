/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {ServerOptions} from 'polyserve/lib/start_server';
import {build, BuildOptions} from '../build/build';
import {Environment} from '../environment/environment';
import {ProjectConfig} from '../project-config';
import {Github} from '../github/github';
import * as temp from 'temp';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as child_process from 'child_process';

temp.track();

const REYSERVE_FILES = ['app.yaml', 'reyserve.py', 'http2push.py'];


export class ReyServe implements Environment {

  build(opts: BuildOptions, config: ProjectConfig): Promise<any> {
    const bundled = path.join(process.cwd(), 'build/bundled');
    const unbundled = path.join(process.cwd(), 'build/unbundled');
    const reyserveFiles = temp.mkdirSync('reyserve');
    return build(opts, config).then(() => {
      console.log('Downloading reyserve release');
      const repo = new Github({owner: 'Polymer', repo: 'reyserve'});
      return repo.extractLatestRelease(reyserveFiles);
    })
    .then(() => {
      console.log('Coyping reyserve files');
      // TODO(garlicnation): One server serves bundled and unbundled.
      REYSERVE_FILES.forEach((file) => {
        fs.copySync(path.join(reyserveFiles, file), path.join(bundled, file));
        fs.copySync(path.join(reyserveFiles, file), path.join(unbundled, file));
      });
    });
  }

  serve(options: ServerOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log('Launching reyserve dev server');
      let devServer = child_process.spawn(
        'dev_appserver.py',
        ['app.yaml'],
        {
          stdio: 'inherit',
          cwd: options.root
        });
      devServer.on('close', (code) => {
        resolve();
      });
    });
  };
}
