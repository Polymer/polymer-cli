/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import {Analyzer} from 'polymer-analyzer';
import {Element} from 'polymer-analyzer/lib/model/model';
import {FSUrlLoader} from 'polymer-analyzer/lib/url-loader/fs-url-loader';
import {PackageUrlResolver} from 'polymer-analyzer/lib/url-loader/package-url-resolver';
import {generateElementMetadata} from 'polymer-analyzer/lib/generate-elements';
import {Elements} from 'polymer-analyzer/lib/elements-format';

export async function analyze(root: string, inputs: string[]): Promise<Elements|undefined> {
  const analyzer = new Analyzer({
    urlLoader: new FSUrlLoader(root),
    urlResolver: new PackageUrlResolver(),
  });

  const elements = new Set<Element>();
  const isInDependency = /(\b|\/|\\)(bower_components|node_modules)(\/|\\)/;

  for (const input of inputs) {
    const document = await analyzer.analyze(input);
    const docElements = Array.from(document.getByKind('element'))
        .filter((e: Element) => !isInDependency.test(e.sourceRange.file));
    docElements.forEach((e) => elements.add(e));
  }
  return generateElementMetadata(Array.from(elements), '');
}
