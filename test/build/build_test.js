/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const del = require('del');

const build = require('../../lib/build/build');

const makeDir = (_path) => fs.mkdirSync(path.resolve(_path));
const rmDir = (_path) => del.sync([path.resolve(_path)]);
const makeFile = (filename, contents, root) => fs.writeFileSync(
    path.resolve(root || '/tmp/root', filename), contents);

const framework = root => makeFile('framework.html', `
<div id="framework"></div>
`, root);

const entrypointA = root => makeFile('entrypointA.html', `
<link rel="import" href="framework.html">
<div id="entrypointA"></div>
`, root);

suite('Build', () => {
  let savedCwd;

  setup(() => {
    savedCwd = process.cwd();
    process.chdir(os.tmpdir());
  });

  teardown(() => {
    process.chdir(savedCwd);
  });

  suite('relative roots', () => {
    const root = 'relative';

    setup(() => {
      makeDir(root);
    });

    teardown(() => {
      rmDir(root);
    });

    test('are supported', () => {
      const root = 'relative';

      framework(root);
      entrypointA(root);

      return build.build({}, {
        root: root,
        entrypoint: path.resolve(root, 'entrypointA.html'),
        fragments: [],
      });
    });
  });
});
