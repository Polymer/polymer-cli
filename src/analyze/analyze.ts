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

import * as globby from 'globby';
import {AnalysisFormat, generateAnalysis} from 'polymer-analyzer';
import {Feature} from 'polymer-analyzer/lib/model/model';
import {ProjectConfig} from 'polymer-project-config';

export async function analyze(config: ProjectConfig, inputs: string[]):
    Promise<AnalysisFormat|undefined> {
  const {analyzer} = await config.initializeAnalyzer();

  const isInTests = /(\b|\/|\\)(test)(\/|\\)/;
  const isNotTest = (f: Feature) =>
      f.sourceRange != null && !isInTests.test(f.sourceRange.file);

  if (inputs == null || inputs.length === 0) {
    const _package = await analyzer.analyzePackage();
    return generateAnalysis(_package, analyzer.urlResolver, isNotTest);
  } else {
    const analysis = await analyzer.analyze(await globby(inputs));
    return generateAnalysis(analysis, analyzer.urlResolver, isNotTest);
  }
}
