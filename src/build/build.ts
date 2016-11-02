/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {dest} from 'vinyl-fs';
import * as gulpif from 'gulp-if';
import * as path from 'path';
import * as del from 'del';
import * as logging from 'plylog';
import * as mergeStream from 'merge-stream';
import {PolymerProject, addServiceWorker, SWConfig} from 'polymer-build';

import {JSOptimizeStream, CSSOptimizeStream, HTMLOptimizeStream} from './optimize-streams';

import {ProjectConfig} from '../project-config';
import {PrefetchTransform} from './prefetch';
import {waitFor} from './streams';
import {parsePreCacheConfig} from './sw-precache';

const logger = logging.getLogger('cli.build.build');

const buildDirectory = 'build';

export interface BuildOptions {
  swPrecacheConfig?: string;
  insertDependencyLinks?: boolean;
  bundled?: boolean;
  // TODO(fks) 07-21-2016: Fully complete these with available options
  html?: {
    collapseWhitespace?: boolean;
    removeComments?: boolean;
  };
  css?: {
    stripWhitespace?: boolean;
  };
  js?: {
    minify?: boolean;
  };
}

export async function build(options: BuildOptions, config: ProjectConfig): Promise<void> {

  let polymerProject = new PolymerProject({
    root: config.root,
    shell: config.shell,
    entrypoint: config.entrypoint,
    fragments: config.fragments,
    sourceGlobs: config.sourceGlobs,
    includeDependencies: config.includeDependencies
  });

  if (options.insertDependencyLinks) {
    logger.debug(`Additional dependency links will be inserted into application`);
  }

  // mix in optimization options from build command
  // TODO: let this be set by the user
  let optimizeOptions = {
    html: Object.assign({removeComments: true}, options.html),
    css: Object.assign({stripWhitespace: true}, options.css),
    js: Object.assign({minify: true}, options.js),
  };

  logger.info(`Preparing build...`);
  logger.debug(`Deleting ${buildDirectory}`);
  await del([buildDirectory]);

  logger.info(`Building application...`);

  logger.debug(`Reading source files...`);
  let sourcesStream = polymerProject.sources();

  logger.debug(`Reading dependencies...`);
  let depsStream = polymerProject.dependencies();

  let buildStream = mergeStream(sourcesStream, depsStream)
    .once('data', () => { logger.debug('Analyzing build dependencies...'); })
    .pipe(gulpif(!options.bundled, polymerProject.analyzer))
    .pipe(polymerProject.splitHtml())
    .pipe(gulpif(/\.js$/, new JSOptimizeStream(optimizeOptions.js)))
    .pipe(gulpif(/\.css$/, new CSSOptimizeStream(optimizeOptions.css)))
    .pipe(gulpif(/\.html$/, new HTMLOptimizeStream(optimizeOptions.html)))
    .pipe(polymerProject.rejoinHtml())
    .pipe(gulpif(options.bundled, polymerProject.analyzer))
    .once('data', () => { logger.info(`Generating ${options.bundled ? 'bundled' : 'unbundled'} build...`); })
    .pipe(
      options.bundled ?
      polymerProject.bundler :
      gulpif(
        options.insertDependencyLinks,
        new PrefetchTransform(polymerProject.root, polymerProject.entrypoint,
          polymerProject.shell, polymerProject.fragments,
          polymerProject.analyzer)
      )
    )
    .pipe(dest(buildDirectory));

  let swPrecacheConfig = path.resolve(polymerProject.root, options.swPrecacheConfig || 'sw-precache-config.js');
  let loadSWConfig = parsePreCacheConfig(swPrecacheConfig);

  loadSWConfig.then((swConfig) => {
    if (swConfig) {
      logger.debug(`Service worker config found`, swConfig);
    } else {
      logger.debug(`No service worker configuration found at ${swPrecacheConfig}, continuing with defaults`);
    }
  });

  // Once the build stream is complete, create a service worker for the build
  await Promise.all([loadSWConfig, waitFor(buildStream)]).then((results) => {
    let swConfig: SWConfig = results[0];
    return addServiceWorker({
      buildRoot: buildDirectory,
      project: polymerProject,
      swConfig: swConfig,
      bundled: options.bundled
    });
  });

  logger.info('Build complete!');
}
