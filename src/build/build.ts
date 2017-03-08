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

import * as path from 'path';
import * as logging from 'plylog';
import {dest} from 'vinyl-fs';

import mergeStream = require('merge-stream');
import {PolymerProject, addServiceWorker, SWConfig, HtmlSplitter} from 'polymer-build';

import {OptimizeOptions, getOptimizeStreams} from './optimize-streams';
import {ProjectConfig, ProjectBuildOptions} from 'polymer-project-config';
import {PrefetchTransform} from './prefetch';
import {waitFor, pipeStreams} from './streams';
import {loadServiceWorkerConfig} from './load-config';
import {UseES5WebcomponentsLoader} from './rewrite-webcomponents-loader';

const logger = logging.getLogger('cli.build.build');
export const mainBuildDirectoryName = 'build';


/**
 * Generate a single build based on the given `options` ProjectBuildOptions.
 * Note that this function is only concerned with that single build, and does
 * not care about the collection of builds defined on the config.
 *
 * TODO(fks) 01-26-2017: Generate multiple builds with a single PolymerProject
 * instance. Currently blocked because splitHtml() & rejoinHtml() cannot be run
 * on multiple streams in parallel. See:
 * https://github.com/Polymer/polymer-build/issues/113
 */
export async function build(
    options: ProjectBuildOptions, config: ProjectConfig): Promise<void> {
  const buildName = options.name || 'default';
  const optimizeOptions:
      OptimizeOptions = {css: options.css, js: options.js, html: options.html};
  const polymerProject = new PolymerProject(config);

  // If no name is provided, write directly to the build/ directory.
  // If a build name is provided, write to that subdirectory.
  const buildDirectory = path.join(mainBuildDirectoryName, buildName);
  logger.debug(`"${buildDirectory}": Building with options:`, options);

  const sourceSplitter = new HtmlSplitter();
  const sourcesStream = pipeStreams([
    polymerProject.sources(),
    sourceSplitter.split(),
    getOptimizeStreams(optimizeOptions),
    sourceSplitter.rejoin()
  ]);

  const depsSplitter = new HtmlSplitter();
  const depsStream = pipeStreams([
    polymerProject.dependencies(),
    depsSplitter.split(),
    getOptimizeStreams(optimizeOptions),
    depsSplitter.rejoin()
  ]);

  let buildStream: NodeJS.ReadableStream =
      mergeStream(sourcesStream, depsStream);

  if (options.bundle) {
    buildStream = buildStream.pipe(polymerProject.bundler);
  }

  if (options.insertPrefetchLinks) {
    buildStream = buildStream.pipe(new PrefetchTransform(polymerProject));
  }

  const compiledToES5 = !!(optimizeOptions.js && optimizeOptions.js.compile);
  if (compiledToES5) {
    buildStream = buildStream.pipe(new UseES5WebcomponentsLoader());
  }

  buildStream.once('data', () => {
    logger.info(`(${buildName}) Building...`);
  });

  // Finish the build stream by piping it into the final build directory.
  buildStream = buildStream.pipe(dest(buildDirectory));

  // If a service worker was requested, parse the service worker config file
  // while the build is in progress. Loading the config file during the build
  // saves the user ~300ms vs. loading it afterwards.
  const swPrecacheConfigPath = path.resolve(
      config.root, options.swPrecacheConfig || 'sw-precache-config.js');
  let swConfig: SWConfig|null = null;
  if (options.addServiceWorker) {
    swConfig = await loadServiceWorkerConfig(swPrecacheConfigPath);
  }

  // There is nothing left to do, so wait for the build stream to complete.
  await waitFor(buildStream);

  // addServiceWorker() reads from the file system, so we need to wait for
  // the build stream to finish writing to disk before calling it.
  if (options.addServiceWorker) {
    logger.debug(`Generating service worker...`);
    if (swConfig) {
      logger.debug(`Service worker config found`, swConfig);
    } else {
      logger.debug(
          `No service worker configuration found at ` +
          `${swPrecacheConfigPath}, continuing with defaults`);
    }
    await addServiceWorker({
      buildRoot: buildDirectory,
      project: polymerProject,
      swPrecacheConfig: swConfig || undefined,
      bundled: options.bundle,
    });
  }

  logger.info(`(${buildName}) Build complete!`);
}
