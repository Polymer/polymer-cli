/**
 * @license
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

import * as del from 'del';
import * as path from 'path';
import * as logging from 'plylog';
import {dest} from 'vinyl-fs';


import mergeStream = require('merge-stream');
import {PolymerProject, addServiceWorker} from 'polymer-build';

import {OptimizeOptions, getOptimizeStreams} from './optimize-streams';

import {ProjectConfig} from 'polymer-project-config';
import {PrefetchTransform} from './prefetch';
import {waitFor, pipeStreams} from './streams';
import {parsePreCacheConfig} from './sw-precache';

const logger = logging.getLogger('cli.build.build');

const buildDirectory = 'build/';

export interface BuildOptions {
  swPrecacheConfig?: string;
  insertPrefetchLinks?: boolean;
  bundle?: boolean;
  optimize?: OptimizeOptions;
};

export async function build(
    options: BuildOptions, config: ProjectConfig): Promise<void> {
  const polymerProject = new PolymerProject(config);
  const swPrecacheConfig = path.resolve(
      config.root, options.swPrecacheConfig || 'sw-precache-config.js');

  logger.info(`Deleting build/ directory...`);
  await del([buildDirectory]);

  logger.debug(`Reading source files...`);
  const sourcesStream = pipeStreams([
    polymerProject.sources(),
    polymerProject.splitHtml(),
    getOptimizeStreams(options.optimize),
    polymerProject.rejoinHtml()
  ]);

  logger.debug(`Reading dependencies...`);
  const depsStream = pipeStreams([
    polymerProject.dependencies(),
    polymerProject.splitHtml(),
    getOptimizeStreams(options.optimize),
    polymerProject.rejoinHtml()
  ]);

  let buildStream: NodeJS.ReadableStream =
      mergeStream(sourcesStream, depsStream);

  buildStream.once('data', () => {
    logger.debug('Analyzing build dependencies...');
  });

  if (options.bundle) {
    buildStream = buildStream.pipe(polymerProject.bundler);
  }

  if (options.insertPrefetchLinks) {
    buildStream = buildStream.pipe(new PrefetchTransform(polymerProject));
  }

  buildStream.once('data', () => {
    logger.info('Generating build/ directory...');
  });

  buildStream = buildStream.pipe(dest(buildDirectory));


  // While the build is in progress, parse the sw precache config
  const swConfig = await parsePreCacheConfig(swPrecacheConfig);
  if (swConfig) {
    logger.debug(`Service worker config found`, swConfig);
  } else {
    logger.debug(`No service worker configuration found at ${swPrecacheConfig
                  }, continuing with defaults`);
  }

  // Now that the build stream has been set up, wait for it to complete.
  await waitFor(buildStream);

  // addServiceWorker() reads from the file system, so we need to wait for
  // the build stream to finish writing to disk before calling it.
  await addServiceWorker({
    buildRoot: buildDirectory,
    project: polymerProject,
    swPrecacheConfig: swConfig || undefined,
    bundled: options.bundle,
  });

  logger.info('Build complete!');
}
