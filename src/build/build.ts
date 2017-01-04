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
import {PolymerProject, addServiceWorker, SWConfig} from 'polymer-build';

import {InlineCSSOptimizeStream, JSOptimizeStream, CSSOptimizeStream, HTMLOptimizeStream} from './optimize-streams';

import {ProjectConfig} from 'polymer-project-config';
import {PrefetchTransform} from './prefetch';
import {waitFor} from './streams';
import {loadServiceWorkerConfig} from './load-config';

const logger = logging.getLogger('cli.build.build');

const buildDirectory = 'build/';

export interface BuildOptions {
  addServiceWorker?: boolean;
  serviceWorkerConfig?: string;
  insertPrefetchLinks?: boolean;
  bundle?: boolean;
  // TODO(fks) 07-21-2016: Fully complete these with available options
  html?: {collapseWhitespace?: boolean; removeComments?: boolean};
  css?: {stripWhitespace?: boolean};
  js?: {minify?: boolean};
}

export async function build(
    options: BuildOptions, config: ProjectConfig): Promise<void> {
  const polymerProject = new PolymerProject(config);
  const swConfigPath = path.resolve(
      config.root, options.serviceWorkerConfig || 'service-worker-config.js');

  // mix in optimization options from build command
  // TODO: let this be set by the user
  let optimizeOptions = {
    html: Object.assign({removeComments: true}, options.html),
    css: Object.assign({stripWhitespace: true}, options.css),
    js: Object.assign({minify: true}, options.js),
  };

  logger.info(`Deleting build/ directory...`);
  await del([buildDirectory]);

  logger.debug(`Reading source files...`);
  let sourcesStream =
      polymerProject.sources()
          .pipe(polymerProject.splitHtml())
          .pipe(gulpif(/\.js$/, new JSOptimizeStream(optimizeOptions.js)))
          .pipe(gulpif(/\.css$/, new CSSOptimizeStream(optimizeOptions.css)))
          // TODO(fks): Remove this InlineCSSOptimizeStream stream once CSS
          // is properly being isolated by splitHtml() & rejoinHtml().
          .pipe(gulpif(/\.html$/, new InlineCSSOptimizeStream(optimizeOptions.css)))
          .pipe(gulpif(/\.html$/, new HTMLOptimizeStream(optimizeOptions.html)))
          .pipe(polymerProject.rejoinHtml());

  logger.debug(`Reading dependencies...`);
  let depsStream =
      polymerProject.dependencies()
          .pipe(polymerProject.splitHtml())
          .pipe(gulpif(/\.js$/, new JSOptimizeStream(optimizeOptions.js)))
          .pipe(gulpif(/\.css$/, new CSSOptimizeStream(optimizeOptions.css)))
          // TODO(fks): Remove this InlineCSSOptimizeStream stream once CSS
          // is properly being isolated by splitHtml() & rejoinHtml().
          .pipe(gulpif(/\.html$/, new InlineCSSOptimizeStream(optimizeOptions.css)))
          .pipe(gulpif(/\.html$/, new HTMLOptimizeStream(optimizeOptions.html)))
          .pipe(polymerProject.rejoinHtml());

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

  // Finish the build stream by piping it into the final build directory.
  buildStream = buildStream.pipe(dest(buildDirectory));

  // If a service worker was requested, parse the service worker config file
  // while the build is in progress. Loading the config file during the build
  // saves the user ~300ms vs. loading it afterwards.
  let swConfig: SWConfig|null = null;
  if (options.addServiceWorker) {
    swConfig = await loadServiceWorkerConfig(swConfigPath);
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
      logger.debug(`No service worker configuration found at ${swConfigPath
                    }, continuing with defaults`);
    }
    await addServiceWorker({
      buildRoot: buildDirectory,
      project: polymerProject,
      swPrecacheConfig: swConfig || undefined,
      bundled: options.bundle,
    });
  }

  logger.info('Build complete!');
}
