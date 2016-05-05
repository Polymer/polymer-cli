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
import * as path from 'path';

// non-ES compatible modules
const swPrecache = require('sw-precache');

export function generateServiceWorker(
    root: string,
    main: string,
    deps: string[]): Promise<string> {
  deps = deps.map((p) => {
    console.assert(p.startsWith(root));
    return p.substring(root.length);
  });
  let mainHtml = main.substring(root.length);
  let precacheFiles = new Set<string>();
  deps.forEach((p) => precacheFiles.add(p));
  precacheFiles.add(mainHtml);
  // TODO: make this more configurable
  precacheFiles.add('/manifest.json');
  precacheFiles.add('/bower_components/webcomponentsjs/webcomponents-lite.min.js');
  precacheFiles.add('/images/*'); //TODO: pull from user precache config

  //TODO: pull from user precache config
  let buildRoot = 'build/bundled';

  let precacheList = Array.from(precacheFiles.values());
  precacheList = precacheList.map((p) => path.join(buildRoot, p));
  console.log('precacheList', precacheList);

  return swPrecache.generate({
    staticFileGlobs: precacheList,
    navigateFallback: mainHtml,
    //TODO: pull from user precache config
    navigateFallbackWhitelist: [/\/data\/.*json/],
    stripPrefix: buildRoot,
    // verbose: true,
  });
}
