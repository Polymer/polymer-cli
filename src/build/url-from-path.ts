/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

/**
 * CODE ADAPTED FROM THE "SLASH" LIBRARY BY SINDRE SORHUS
 * https://github.com/sindresorhus/slash
 *
 * ORIGINAL LICENSE:
 * The MIT License (MIT)
 *
 * Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)*
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy*
 * of this software and associated documentation files (the "Software"), to deal*
 * in the Software without restriction, including without limitation the rights*
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell*
 * copies of the Software, and to permit persons to whom the Software is*
 * furnished to do so, subject to the following conditions:*
 *
 * The above copyright notice and this permission notice shall be included in*
 * all copies or substantial portions of the Software.*
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR*
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,*
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE*
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER*
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,*
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN*
 * THE SOFTWARE.
 */

import * as path from 'path';

export default function urlFromPath(root, filepath) {
  if (!filepath.startsWith(root)) {
    throw new Error(`file path is not in root: ${filepath} (${root})`);
  }

  // On windows systems, convert filesystem path to URL by replacing slashes
  let isPlatformWin = /^win/.test(process.platform);
  let isExtendedLengthPath = /^\\\\\?\\/.test(filepath);
  let hasNonAscii = /[^\x00-\x80]+/.test(filepath);
  if (isPlatformWin && !isExtendedLengthPath && !hasNonAscii) {
    return path.win32.relative(root, filepath).replace(/\\/g, '/');
  }

  // Otherwise, just return the relative path between the two
  return path.relative(root, filepath);
}
