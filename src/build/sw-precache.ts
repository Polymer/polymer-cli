/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */


import * as fs from 'fs';
import * as logging from 'plylog';
import {SWConfig} from 'polymer-build';

let logger = logging.getLogger('cli.build.sw-precache');

export function parsePreCacheConfig(configFile: string): Promise<SWConfig> {
  return new Promise<SWConfig>((resolve, reject) => {
    fs.stat(configFile, (statError) => {
      let config: SWConfig;
      // only log if the config file exists at all
      if (!statError) {
        try {
          config = require(configFile);
        } catch (loadError) {
          logger.warn(`${configFile} file was found but could not be loaded`, {loadError});
        }
      }
      resolve(config);
    });
  });
}
