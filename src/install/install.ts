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

import * as bower from 'bower';
import {read as readBowerJson} from 'bower-json';
import * as path from 'path';
import * as logging from 'plylog';

import defaultBowerConfig = require('bower/lib/config');
import BowerLogger = require('bower-logger');
import StandardRenderer = require('bower/lib/renderers/StandardRenderer');
import BowerProject = require('bower/lib/core/Project');

const logger = logging.getLogger('cli.install');

type JsonValue = string|number|boolean|null|JsonObject|JsonArray;

interface JsonObject {
  [key: string]: JsonValue;
}

interface JsonArray extends Array<JsonValue> {}

export interface Options {
  variants?: boolean;
  offline?: boolean;
}

export async function install(options?: Options): Promise<void> {
  // default to false
  const offline = options == null ? false : options.offline === true;
  // default to false
  const variants = options == null ? false : options.variants === true;

  await Promise.all([
    installDefault(offline),
    variants ? installVariants(offline) : Promise.resolve(),
  ]);
}

/**
 * Performs a Bower install, optionally with a specific JSON configuration and
 * output directory.
 */
async function _install(
    offline: boolean,
    bowerJson?: JsonObject,
    componentDirectory?: string,
    variantName?: string):
    Promise<void> {
      const config = defaultBowerConfig({
        save: false,
        directory: componentDirectory, offline,
      });

      const bowerLogger = new BowerLogger();
      const cwd: string = config.cwd || process.cwd();
      const renderer = new StandardRenderer('install', {
        cwd,
        color: true,
      });
      bowerLogger.on('log', (log: bower.LogData) => renderer.log(log));
      bowerLogger.on('end', (data: any) => renderer.end(data));
      bowerLogger.on('error', (err: Error) => renderer.error(err));

      const project = new BowerProject(config, bowerLogger);

      // This is the only way I could find to provide a JSON object to the
      // Project. It's a hack, and might break in the future, but it works.
      if (bowerJson) {
        (project as any)._json = bowerJson;
        // Generate a new fake bower.json name because Bower is insting on
        // overwriting this file, even with the {save: false}.
        // TODO(justinfagnani): Figure this out
        const fileName =
            variantName ? `bower-${variantName}.json` : `bower.json`;
        (project as any)._jsonFile = path.join(cwd, fileName);
      }

      await project.install([], {save: false, offline}, config);
    }

async function installDefault(offline: boolean):
    Promise<void> {
      logger.info(`Installing default Bower components...`);
      await _install(offline);
      logger.info(`Finished installing default Bower components`);
    }

async function installVariants(offline: boolean):
    Promise<void> {
      const bowerJson = await new Promise<any>((resolve, reject) => {
        const config = defaultBowerConfig({
          save: false,
        });
        const cwd = config.cwd || process.cwd();
        readBowerJson(cwd, {}, (err: any, json: any) => {
          err ? reject(err) : resolve(json);
        });
      });

      // Variants are patches ontop of the default bower.json, typically used to
      // override dependencies to specific versions for testing. Variants are
      // installed into folders named "bower_components-{variantName}", which
      // are
      // used by other tools like polyserve.
      const variants = bowerJson['variants'];
      if (variants) {
        await Promise.all(Object.keys(variants).map(async(variantName) => {
          const variant = variants[variantName];
          const variantBowerJson = _mergeJson(variant, bowerJson) as JsonObject;
          const variantDirectory = `bower_components-${variantName}`;
          logger.info(
              `Installing variant ${variantName} to ${variantDirectory}...`);
          await _install(
              offline, variantBowerJson, variantDirectory, variantName);
          logger.info(`Finished installing variant ${variantName}`);
        }));
      }
    }

/**
 * Exported only for testing
 */
export function _mergeJson(from: JsonValue, to: JsonValue):
    JsonValue {
      if (isPrimitiveOrArray(from) || isPrimitiveOrArray(to)) {
        return from;
      }
      const toObject = to as JsonObject;
      const fromObject = from as JsonObject;
      // First, make a shallow copy of `to` target
      const merged = Object.assign({}, toObject);

      // Next, merge in properties from `from`
      for (const key in fromObject) {
        // TODO(justinfagnani): If needed, we can add modifiers to the key
        // names in `from` to control merging:
        //   * "key=" would always overwrite, not merge, the property
        //   * "key|" could force a union (merge), even for Arrays
        //   * "key&" could perform an intersection
        merged[key] = _mergeJson(fromObject[key], toObject[key]);
      }
      return merged;
    }

function isPrimitiveOrArray(value: any) {
  if (value == null)
    return true;
  if (Array.isArray(value))
    return true;
  const type = typeof value;
  return type === 'string' || type === 'number' || type === 'boolean';
}
