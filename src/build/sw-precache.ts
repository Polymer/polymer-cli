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
import {Transform} from 'stream';
import File = require('vinyl');

// non-ES compatible modules
const swPrecache = require('sw-precache');

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

function generateServiceWorker(
    root: string,
    main: string,
    deps: string[],
    buildRoot: string,
    swConfig?: SWConfig
  ): Promise<string> {
  swConfig = swConfig || <SWConfig>{};
  deps = deps.map((p) => {
    console.assert(p.startsWith(root));
    return p.substring(root.length);
  });
  let mainHtml = main.substring(root.length);
  let precacheFiles = new Set(swConfig.staticFileGlobs);
  deps.forEach((p) => precacheFiles.add(p));
  precacheFiles.add(mainHtml);

  let precacheList = Array.from(precacheFiles);
  precacheList = precacheList.map((p) => path.join(buildRoot, p));
  console.log('precacheList' , precacheList);

  swConfig.stripPrefix = buildRoot;
  swConfig.staticFileGlobs = precacheList;
  // TODO: determine if this is a good default, or pull from user precache config
  swConfig.navigateFallback = mainHtml;

  return swPrecache.generate(swConfig);
}

export interface SWPreCacheTransformOptions {
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
   * Name of the output service worker file.
   */
  serviceWorkerName: string;
  /**
   * Promise that returns the list of files to be cached by the service worker.
   *
   * If not given, all files streamed to SWPreCacheTransform will be put into the precache list, except for the file matching `configFileName`.
   */
  deps?: Promise<string[]>;
  /**
   * Existing config file to use as a base for the serivce worker generation.
   *
   * This file will not be copied into the output bundles.
   */
  configFileName?: string;
}

export class SWPreCacheTransform extends Transform {
  swConfig: SWConfig;
  options: SWPreCacheTransformOptions;
  fileSet: Set<string>;
  fullConfigFilePath: string;

  constructor(options: SWPreCacheTransformOptions) {
    super({objectMode: true});
    this.options = options;
    // if no given deps, collect all input files as deps
    if (!options.deps) {
      this.fileSet = new Set<string>();
    }
    if (options.configFileName) {
      this.fullConfigFilePath = path.resolve(
        options.root,
        options.configFileName
      );
    }
  }

  _transform(file: File, encoding: string, callback:(error?, data?) => void): void {
    if (file.path === this.fullConfigFilePath) {
      this.swConfig = JSON.parse(file.contents.toString());
      callback(null, null);
    } else {
      if (this.fileSet) {
        this.fileSet.add(file.path);
      }
      callback(null, file);
    }
  }

  end() {
    let promise: Promise<string[]>;
    if (this.fileSet) {
      promise = Promise.resolve(Array.from(this.fileSet));
    } else {
      promise = this.options.deps;
    }
    promise.then((deps) => {
      return generateServiceWorker(
        this.options.root,
        this.options.main,
        deps,
        this.options.buildRoot,
        this.swConfig
      );
    })
    .then((config) => {
      let file = new File({
        path: path.resolve(
          this.options.buildRoot,
          this.options.serviceWorkerName
        ),
        contents: new Buffer(config)
      });
      this.push(file);
      super.end();
    });
  }
}
