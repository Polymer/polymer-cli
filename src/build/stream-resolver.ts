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
}

export class StreamResolver extends Transform /* implements Resolver*/ {

  _files = new Map<string, File>();
  _deferreds = new Map<string, Deferred<string>>();
  config: Config;

  constructor(config: Config) {
    super({objectMode: true});
    this.config = config || {};
  }

  _transform(file: File, encoding: string, callback: (error?, data?) => void): void {
    let isEntrypoint = minimatch(file.path, this.config.entrypoint, {
      matchBase: true,
    });
    if (isEntrypoint) {
      this._files.set(file.path, file);
      callback(null, file);
      return;
    }
    let deferred = this._deferreds.get(file.path);
    if (deferred) {
      this._deferreds.delete(file.path);
      deferred.resolve(file.contents.toString());
    } else {
      this._files.set(file.path, file);
    }
    callback(null, null);
  }

  accept(uri: string, deferred: Deferred<string>): boolean {
    var parsed = url.parse(uri);
    var host = this.config.host;
    var base = this.config.basePath && decodeURIComponent(this.config.basePath);
    var root = this.config.root && path.normalize(this.config.root);
    var redirect = this.config.redirect;

    var local: string;

    if (!parsed.hostname || parsed.hostname === host) {
      local = parsed.pathname;
    }
    if (local) {
      // un-escape HTML escapes
      local = decodeURIComponent(local);

      if (base) {
        local = path.relative(base, local);
      }
      if (root) {
        local = path.join(root, local);
      }

      if (redirect && isSiblingOrAunt(root, local)) {
        local = redirectSibling(root, local, redirect);
        getFile(local, deferred);
        return true;
      }

      let file : File = this._files.get(local);
      if (file) {
        deferred.resolve(file.contents.toString());
      } else {
        this._deferreds.set(local, deferred);
      }
      return true;
    }

    return false;
  }

  complete() {
    for (let deferred in this._deferreds.values) {
      (<Deferred<string>><any>deferred).reject(null);
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
