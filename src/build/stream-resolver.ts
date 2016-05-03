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
import {Resolver, Deferred, FSResolver} from 'hydrolysis';
import * as minimatch from 'minimatch';
import * as path from 'path';
import {Transform} from 'stream';
import File = require('vinyl');
import * as url from 'url';

export interface FileGetter {
  (filePath: string, deferred: Deferred<string>): void;
}

export interface Config {
  entrypoint?: string;

  /**
   * Hostname to match for absolute urls.
   * Matches "/" by default
   */
  host?: string;

  /**
   * Prefix directory for components in url. Defaults to "/".
   */
  basePath?: string;

  /**
   * Filesystem root to search. Defaults to the current working directory.
   */
  root?: string;

  /**
   * Where to redirect lookups to siblings.
   */
  redirect?: string;
  sources?: string[];
  getFile?: FileGetter;
}

export class StreamResolver extends Transform /* implements Resolver*/ {

  _files = new Map<string, File>();

  // filename -> Hydrolysis Deferred request for file
  _deferreds = new Map<string, Deferred<string>>();

  host: string;
  base: string;
  root: string;
  redirect: string;
  entrypoint: string;
  sources: string[];
  getFile: FileGetter;

  constructor(config: Config) {
    super({objectMode: true});
    this.host = config.host;
    this.base = config.basePath && decodeURIComponent(config.basePath);
    this.root = config.root && path.normalize(config.root);
    this.redirect = config.redirect;
    if (!config.entrypoint) {
      throw new Error('entrypoint must be specified');
    }
    this.entrypoint = config.entrypoint;
    this.sources = config.sources || [];
    this.getFile = config.getFile || getFile;
  }

  _transform(file: File, encoding: string, callback: (error?, data?) => void): void {
    let isEntrypoint = minimatch(file.path, this.entrypoint, {
      matchBase: true,
    });


    // If this is the entrypoint, pass the file on
    if (isEntrypoint) {
      this._files.set(file.path, file);
      callback(null, file);
      return;
    }

    // If not, first see if the file has been requested...
    let deferred = this._deferreds.get(file.path);
    if (deferred) {
      // ... if so, resolve the request
      deferred.resolve(file.contents.toString());
      this._deferreds.delete(file.path);
    } else {
      // ... if not, store the file for a future request
      this._files.set(file.path, file);
    }
    // Never pass on non-entrypoints
    // TODO(justinfagnani): possibly change this after more testing
    callback(null, null);
  }

  accept(uri: string, deferred: Deferred<string>): boolean {
    var parsed = url.parse(uri);
    var local: string;

    if (!parsed.hostname || parsed.hostname === this.host) {
      local = parsed.pathname;
    }

    if (local) {
      // un-escape HTML escapes
      local = decodeURIComponent(local);

      // If there's a base path, strip it from the file path, unless the file
      // path is an absolute URL not under base, such as /bower_components/...
      if (this.base && (!path.isAbsolute(local) || local.startsWith(this.base))) {
        local = path.relative(this.base, local);
      }

      if (this.root) {
        local = path.join(this.root, local);
      }

      let isInSources = this.sources.some(s => minimatch(local, path.join(this.root, s)));

      // If the requested file is not in source, it will not be streamed into
      // the resolver, so load it from disk
      if (!isInSources) {
        this.getFile(local, deferred);
        return true;
      }

      let file: File = this._files.get(local);
      if (file) {
        // If we have a file from the stream already, resolve it...
        deferred.resolve(file.contents.toString());
      } else {
        // Otherwise save the deffered to resolve later
        this._deferreds.set(local, deferred);
      }
      return true;
    }

    return false;
  }

  end() {
    // When the stream is done, reject all non-resolved requests for files
    for (let deferred of this._deferreds.values()) {
      deferred.reject(null);
    }
  }
}

function getFile(filePath: string, deferred: Deferred<string>) {
  fs.readFile(filePath, 'utf-8', function(err, content) {
    if (err) {
      console.log("ERROR finding " + filePath);
      deferred.reject(err);
    } else {
      deferred.resolve(content);
    }
  });
}

/**
 * Returns true if `patha` is a sibling or aunt of `pathb`.
 */
function isSiblingOrAunt(patha: string, pathb: string) {
  var parent = path.dirname(patha);
  if (pathb.indexOf(patha) === -1 && pathb.indexOf(parent) === 0) {
    return true;
  }
  return false;
}

/**
 * Change `localPath` from a sibling of `basePath` to be a child of
 * `basePath` joined with `redirect`.
 */
function redirectSibling(basePath: string, localPath: string, redirect: string) {
  var parent = path.dirname(basePath);
  var redirected = path.join(basePath, redirect, localPath.slice(parent.length));
  return redirected;
}
