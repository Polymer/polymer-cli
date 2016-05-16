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
let Manifest = require('http2-push-manifest');

export function generatePushManifest(
  root: string,
  buildRoot: string,
  files: string[]
): Promise<void> {
  return new Promise<void>((resolve) => {
    files = files.map((f) => path.relative(root, f));
    let manifests = files.map((f) =>
      new Manifest({
        basePath: buildRoot,
        inputPath: f
      })
    );
    let manifestPromises = manifests.map((m) => m.generate());
    Promise.all(manifestPromises).then((configs) => {
      let combined = {};
      for (let i = 0; i < manifests.length; i++) {
        let m = manifests[i];
        combined[m.inputPath] = configs[i].file;
      }
      let combinedJSON = JSON.stringify(combined, null, 2);
      let outfile = path.join(buildRoot, 'push_manifest.json');
      fs.writeFileSync(outfile, combinedJSON);
      resolve();
    });
  });
}
