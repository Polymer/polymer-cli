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

import {Analyzer} from 'polymer-analyzer';
import {Analysis} from 'polymer-analyzer/lib/analysis-format';
import {generateAnalysis} from 'polymer-analyzer/lib/generate-analysis';
import {Feature} from 'polymer-analyzer/lib/model/model';
import {FSUrlLoader} from 'polymer-analyzer/lib/url-loader/fs-url-loader';
import {PackageUrlResolver} from 'polymer-analyzer/lib/url-loader/package-url-resolver';

export async function analyze(
    root: string, inputs: string[]): Promise<Analysis|undefined> {
  const analyzer = new Analyzer({
    urlLoader: new FSUrlLoader(root),
    urlResolver: new PackageUrlResolver(),
  });

  const isInTests = /(\b|\/|\\)(test)(\/|\\)/;
  const isNotTest = (f: Feature) =>
      f.sourceRange != null && !isInTests.test(f.sourceRange.file);

  if (inputs == null || inputs.length === 0) {
    const _package = await analyzer.analyzePackage();
    return generateAnalysis(_package, '', isNotTest);
  } else {
    const documents = await Promise.all(inputs.map((i) => analyzer.analyze(i)));
    return generateAnalysis(documents, '', isNotTest);
  }
}
