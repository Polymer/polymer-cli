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
import * as logging from 'plylog';
import {PassThrough} from 'stream';
import File = require('vinyl');

// non-ES compatible modules
const swPrecache = require('sw-precache');
const Module = require('module');
let logger = logging.getLogger('cli.build.sw-precache');

function writeSWPrecache(destinationPath: string, config: SWConfig): Promise<void> {
  config.logger = logger.debug;
  return swPrecache.write(destinationPath, config);
}

export interface SWConfig {
  cacheId?: string;
  directoryIndex?: string;
  dynamicUrlToDependencies?: {
    [property: string]: string[]
  };
  handleFetch?: boolean;
  ignoreUrlParametersMatching?: RegExp[];
  importScripts?: string[];
  logger?: Function;
  maximumFileSizeToCacheInBytes?: number;
  navigateFallback?: string;
  navigateFallbackWhitelist?: RegExp[];
  replacePrefix?: string;
  runtimeCaching?: {
    urlPattern: RegExp;
    handler: string;
    options?: {
      cache: {
        maxEntries: number;
        name: string;
      };
    };
  }[];
  staticFileGlobs?: string[];
  stripPrefix?: string;
  templateFilePath?: string;
  verbose?: boolean;
}

export function generateServiceWorker(options: GenerateServiceWorkerOptions)
: Promise<void> {
  logger.debug(`generateServiceWorker() options:`, options);
  let swConfig = options.swConfig || <SWConfig>{};
  // strip root prefix, so buildRoot prefix can be added safely
  let scriptsAndImports = options.deps;
  if (options.scriptAndStyleDeps) {
    scriptsAndImports = scriptsAndImports.concat(options.scriptAndStyleDeps);
  }
  let deps = scriptsAndImports.map((p) => {
    if (p.startsWith(options.root)) {
      return p.substring(options.root.length);
    }
    return p;
  });
  let mainHtml = options.entrypoint.substring(options.root.length);
  let precacheFiles = new Set(swConfig.staticFileGlobs);
  deps.forEach((p) => precacheFiles.add(p));
  precacheFiles.add(mainHtml);

  let precacheList = Array.from(precacheFiles);
  precacheList = precacheList.map((p) => path.join(options.buildRoot, p));

  // swPrecache will determine the right urls by stripping buildRoot
  swConfig.stripPrefix = options.buildRoot;
  // static files will be pre-cached
  swConfig.staticFileGlobs = precacheList;

  logger.debug(`writing service worker to ${options.serviceWorkerPath}`, swConfig);
  return writeSWPrecache(options.serviceWorkerPath, swConfig);
}

export function parsePreCacheConfig(configFile: string): Promise<SWConfig> {
  return new Promise<SWConfig>((resolve, reject) => {
    fs.stat(configFile, (err) => {
      let config: SWConfig;
      // only log if the config file exists at all
      if (!err) {
        try {
          config = require(configFile);
        } catch (e) {
          logger.warn(`${configFile} file was found but could not be loaded`, {err});
        }
      }
      resolve(config);
    });
  });
}

export interface GenerateServiceWorkerOptions {
  /**
   * folder containing files to be served by the service worker.
   */
  root: string;
  /**
   * Main file to serve from service worker.
   */
  entrypoint: string;
  /**
   * Output folder for the service worker bundle
   */
  buildRoot: string;
  /**
   * File path of the output service worker file.
   */
  serviceWorkerPath: string;
  /**
   * List of files to be cached by the service worker,
   * in addition to files found in `swConfig.staticFileGlobs`
   */
  deps: string[];
  /**
   * List of script and style dependencies.
   */
  scriptAndStyleDeps: string[];
  /**
   * Existing config to use as a base for the serivce worker generation.
   */
  swConfig?: SWConfig;
}
