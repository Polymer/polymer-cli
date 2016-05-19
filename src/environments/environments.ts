/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {Environment} from '../environment/environment';

import {ReyServe} from './reyserve';

class EnvironmentMap extends Map<string, {new(): Environment}> {
}

// TODO(garlicnation): Bring this into polytool.ts
const environments = new EnvironmentMap();
// TODO(garlicnation): Re-enable
// environments.set('reyserve', ReyServe);

/**
 * Builds an environment with the given name.
 */
export function buildEnvironment(name: string): Environment {
  return environments.has(name) && new (environments.get(name.toLowerCase()))();
}
