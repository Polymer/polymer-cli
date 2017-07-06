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
import {forkStream, PolymerProject, addServiceWorker, SWConfig, HtmlSplitter} from 'polymer-build';

import {OptimizeOptions, getOptimizeStreams} from './optimize-streams';
import {ProjectBuildOptions} from 'polymer-project-config';
import {waitFor, pipeStreams} from './streams';
import {loadServiceWorkerConfig} from './load-config';

const logger = logging.getLogger('cli.build.build');
export const mainBuildDirectoryName = 'build';


/**
 * Generate a single build based on the given `options` ProjectBuildOptions.
 * Note that this function is only concerned with that single build, and does
 * not care about the collection of builds defined on the config.
 */
export async function build(
    options: ProjectBuildOptions,
    polymerProject: PolymerProject): Promise<void> {
  const buildName = options.name || 'default';
  const optimizeOptions:
      OptimizeOptions = {css: options.css, js: options.js, html: options.html};

  // If no name is provided, write directly to the build/ directory.
  // If a build name is provided, write to that subdirectory.
  const buildDirectory = path.join(mainBuildDirectoryName, buildName);
  logger.debug(`"${buildDirectory}": Building with options:`, options);

  // Fork the two streams to guarentee we are working with clean copies of each
  // file and not sharing object references with other builds.
  const sourcesStream = forkStream(polymerProject.sources());
  const depsStream = forkStream(polymerProject.dependencies());
  const htmlSplitter = new HtmlSplitter();

  let buildStream: NodeJS.ReadableStream = pipeStreams([
    mergeStream(sourcesStream, depsStream),
    htmlSplitter.split(),
    getOptimizeStreams(optimizeOptions),
    htmlSplitter.rejoin()
  ]);

  const compiledToES5 = !!(optimizeOptions.js && optimizeOptions.js.compile);
  if (compiledToES5) {
    buildStream = buildStream.pipe(polymerProject.addBabelHelpersInEntrypoint())
                      .pipe(polymerProject.addCustomElementsEs5Adapter());
  }

  const bundled = !!(options.bundle);
  if (bundled && typeof options.bundle === 'object') {
    buildStream = buildStream.pipe(polymerProject.bundler(options.bundle));
  } else if (bundled) {
    buildStream = buildStream.pipe(polymerProject.bundler());
  }

  if (options.insertPrefetchLinks) {
    buildStream = buildStream.pipe(polymerProject.addPrefetchLinks());
  }

  buildStream.once('data', () => {
    logger.info(`(${buildName}) Building...`);
  });

  if (options.basePath) {
    let basePath = options.basePath === true ? buildName : options.basePath;
    if (!basePath.startsWith('/')) {
      basePath = '/' + basePath;
    }
    if (!basePath.endsWith('/')) {
      basePath = basePath + '/';
    }
    buildStream = buildStream.pipe(polymerProject.updateBaseTag(basePath));
  }

  if (options.addPushManifest) {
    buildStream = buildStream.pipe(polymerProject.addPushManifest());
  }

  // Finish the build stream by piping it into the final build directory.
  buildStream = buildStream.pipe(dest(buildDirectory));

  // If a service worker was requested, parse the service worker config file
  // while the build is in progress. Loading the config file during the build
  // saves the user ~300ms vs. loading it afterwards.
  const swPrecacheConfigPath = path.resolve(
      polymerProject.config.root,
      options.swPrecacheConfig || 'sw-precache-config.js');
  let swConfig: SWConfig|null = null;
  if (options.addServiceWorker) {
    swConfig = await loadServiceWorkerConfig(swPrecacheConfigPath);
  }

  // There is nothing left to do, so wait for the build stream to complete.
  await waitFor(buildStream);

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
      bundled: bundled,
    });
  }

  logger.info(`(${buildName}) Build complete!`);
}
