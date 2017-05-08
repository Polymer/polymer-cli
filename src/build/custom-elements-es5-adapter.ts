import * as dom5 from 'dom5';
import {predicates as p} from 'dom5';
import * as parse5 from 'parse5';
import * as stream from 'stream';
import * as url from 'url';

import File = require('vinyl');

const attrValueMatches = (attrName: string, regex: RegExp) => {
  return (node: parse5.ASTNode) => {
    const attrValue = dom5.getAttribute(node, attrName);
    return attrValue != null && regex.test(attrValue);
  };
};

const webcomponentsLoaderRegex = /\bwebcomponents\-(loader|lite)\.js\b/;
const webcomponentsLoaderMatcher = p.AND(
    p.hasTagName('script'), attrValueMatches('src', webcomponentsLoaderRegex));

/**
 * Wraps `addCustomElementsEs5Adapter()` in a `stream.Transform`.
 */
export class CustomElementsEs5AdapterInjector extends stream.Transform {
  constructor() {
    super({objectMode: true});
  }

  async _transform(
      file: File,
      _encoding: string,
      callback: (error?: any, file?: File) => void) {
    let contents: string;
    if (file.contents === null || file.extname !== '.html') {
      callback(null, file);
      return;
    }
    if (file.isBuffer()) {
      contents = file.contents.toString('utf-8');
    } else {
      const stream = file.contents as NodeJS.ReadableStream;
      stream.setEncoding('utf-8');
      contents = '';
      stream.on('data', (chunk: string) => contents += chunk);
      await new Promise((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
      });
    }

    const updatedContents = addCustomElementsEs5Adapter(contents);
    if (contents === updatedContents) {
      callback(null, file);
    } else {
      const updatedFile = file.clone();
      updatedFile.contents = new Buffer(updatedContents, 'utf-8');
      callback(null, updatedFile);
    }
  }
}

/**
 * Please avoid using this function because the API is likely to change. Prefer
 * the interface provided by `PolymerProject.addCustomElementsEs5Adapter`.
 *
 * When compiling ES6 classes down to ES5 we need to include a special shim so
 * that compiled custom elements will still work on browsers that support native
 * custom elements.
 *
 * TODO(fks) 03-28-2017: Add tests.
 */
export function addCustomElementsEs5Adapter(html: string): string {
  // Only modify this file if we find a web components polyfill. This is a
  // heuristic to identify the entry point HTML file. Ultimately we should
  // explicitly transform only the entry point by having the project config.
  if (!webcomponentsLoaderRegex.test(html)) {
    return html;
  }
  const parsed = parse5.parse(html, {locationInfo: true});
  const script = dom5.nodeWalk(parsed, webcomponentsLoaderMatcher);
  if (!script) {
    return html;
  }

  // Collect important dom references & create fragments for injection.
  const loaderScriptUrl = dom5.getAttribute(script, 'src')!;
  const adapterScriptUrl =
      url.resolve(loaderScriptUrl, 'custom-elements-es5-adapter.js');
  const es5AdapterFragment = parse5.parseFragment(`
    <!-- Start ES5 Adapter Smart-Injection: This code is injected so that your
    ES5-compiled custom elements will still work on browsers that support native
    custom elements. The adapter will comment itself out if
     \`window.customElements\` is not defined. -->
    <script>if (!window.customElements) { document.write('<!--'); }</script>
    <script type="text/javascript" src="${adapterScriptUrl}"></script>
    <!-- End Smart-Injection (Do not remove this comment) -->
`);

  dom5.insertBefore(script.parentNode!, script, es5AdapterFragment);
  return parse5.serialize(parsed);
}
