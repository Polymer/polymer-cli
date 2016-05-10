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
import {Transform, PassThrough} from 'stream';
import File = require('vinyl');

// non-ES compatible modules
const swPrecache = require('sw-precache');
const Module = require('module');

interface SWConfig {
  cacheId?: string,
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

export function generateServiceWorker(options: generateServiceWorkerOptions)
: Promise<string> {
  let swConfig = options.swConfig || <SWConfig>{};
  // strip root prefix, so buildRoot prefix can be added safely
  let deps = options.deps.map((p) => {
    if (p.startsWith(options.root)) {
      return p.substring(options.root.length);
    }
    return p;
  });
  let mainHtml = options.main.substring(options.root.length);
  let precacheFiles = new Set(swConfig.staticFileGlobs);
  deps.forEach((p) => precacheFiles.add(p));
  precacheFiles.add(mainHtml);

  let precacheList = Array.from(precacheFiles);
  precacheList = precacheList.map((p) => path.join(options.buildRoot, p));

  // swPrecache will determine the right urls by stripping buildRoot
  swConfig.stripPrefix = options.buildRoot;
  // static files will be pre-cached
  swConfig.staticFileGlobs = precacheList;

  console.log(`Generating service worker for ${options.buildRoot}`);

  return swPrecache.write(options.serviceWorkerPath, swConfig);
}

export function parsePreCacheConfig(configFile: string): Promise<SWConfig> {
  return new Promise<SWConfig>((resolve, reject) => {
    try {
      let config: SWConfig = require(configFile);
      resolve(config);
    } catch(e) {
      console.error(`Could not load sw-precache config from ${configFile}`);
      console.error(e);
      resolve();
    }
  });
}

export interface generateServiceWorkerOptions {
  /**
   * folder containing files to be served by the service worker.
   */
  root: string;
  /**
   * Main file to serve from service worker.
   */
  main: string;
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
   * Existing config to use as a base for the serivce worker generation.
   */
  swConfig?: SWConfig;
}
