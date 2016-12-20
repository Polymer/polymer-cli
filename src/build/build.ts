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
import * as gulpif from 'gulp-if';
import * as path from 'path';
import * as logging from 'plylog';
import {dest} from 'vinyl-fs';


import mergeStream = require('merge-stream');
import {PolymerProject, addServiceWorker, forkStream, SWConfig} from 'polymer-build';

import {OptimizeOptions, getOptimizeStreams} from './optimize-streams';

import {ProjectConfig} from 'polymer-project-config';
import {PrefetchTransform} from './prefetch';
import {waitFor} from './streams';
import {parsePreCacheConfig} from './sw-precache';

const logger = logging.getLogger('cli.build.build');

const unbundledBuildDirectory = 'build/unbundled';
const bundledBuildDirectory = 'build/bundled';

export interface BuildOptions {
  swPrecacheConfig?: string;
  insertDependencyLinks?: boolean;
  optimize?: OptimizeOptions;
};

export async function build(
    options: BuildOptions, config: ProjectConfig): Promise<void> {
  let polymerProject = new PolymerProject(config);

  if (options.insertDependencyLinks) {
    logger.debug(
        `Additional dependency links will be inserted into application`);
  }

  logger.info(`Preparing build...`);
  await del([unbundledBuildDirectory, bundledBuildDirectory]);

  logger.info(`Building application...`);

  logger.debug(`Reading source files...`);
  const sourcesStream = [].concat.apply([], [
    polymerProject.sources(),
    polymerProject.splitHtml(),
    getOptimizeStreams(options.optimize),
    polymerProject.rejoinHtml()
  ]).reduce((a: NodeJS.ReadableStream, b: NodeJS.ReadWriteStream) => {
    return a.pipe(b);
  });

  logger.debug(`Reading dependencies...`);
  const depsStream = [].concat.apply([], [
    polymerProject.dependencies(),
    polymerProject.splitHtml(),
    getOptimizeStreams(options.optimize),
    polymerProject.rejoinHtml()
  ]).reduce((a: NodeJS.ReadableStream, b: NodeJS.ReadWriteStream) => {
    return a.pipe(b);
  });

  let buildStream = mergeStream(sourcesStream, depsStream);

  let unbundledPhase = forkStream(buildStream)
                           .once(
                               'data',
                               () => {
                                 logger.info('Generating build/unbundled...');
                               })
                           .pipe(gulpif(
                               options.insertDependencyLinks || false,
                               new PrefetchTransform(polymerProject)))
                           .pipe(dest(unbundledBuildDirectory));

  let bundledPhase = forkStream(buildStream)
                         .once(
                             'data',
                             () => {
                               logger.info('Generating build/bundled...');
                             })
                         .pipe(polymerProject.bundler)
                         .pipe(dest(bundledBuildDirectory));

  let swPrecacheConfig = path.resolve(
      config.root, options.swPrecacheConfig || 'sw-precache-config.js');
  let loadSWConfig = parsePreCacheConfig(swPrecacheConfig);

  loadSWConfig.then((swConfig) => {
    if (swConfig) {
      logger.debug(`Service worker config found`, swConfig);
    } else {
      logger.debug(`No service worker configuration found at ${swPrecacheConfig
                   }, continuing with defaults`);
    }
  });

  // Once the unbundled build stream is complete, create a service worker for
  // the build
  let unbundledPostProcessing =
      Promise.all([loadSWConfig, waitFor(unbundledPhase)]).then((results) => {
        let swConfig: SWConfig|undefined = results[0] || undefined;
        return addServiceWorker({
          buildRoot: unbundledBuildDirectory,
          project: polymerProject,
          swPrecacheConfig: swConfig,
        });
      });

  // Once the bundled build stream is complete, create a service worker for the
  // build
  let bundledPostProcessing =
      Promise.all([loadSWConfig, waitFor(bundledPhase)]).then((results) => {
        let swConfig: SWConfig|undefined = results[0] || undefined;
        return addServiceWorker({
          buildRoot: bundledBuildDirectory,
          project: polymerProject,
          swPrecacheConfig: swConfig,
          bundled: true,
        });
      });

  await Promise.all([unbundledPostProcessing, bundledPostProcessing]);
  logger.info('Build complete!');
}
