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
    p.hasTagName('script'),
    attrValueMatches('src', webcomponentsLoaderRegex));
const headMatcher = p.hasTagName('head');
const bodyMatcher = p.hasTagName('body');
const scriptMatcher = p.AND(
    p.hasTagName('script'),
    p.OR(
        webcomponentsLoaderMatcher,
        p.NOT(p.hasAttr('type')),
        p.hasAttrValue('type', 'text/javascript'),
        p.hasAttrValue('type', 'application/javascript')));
const linkMatcher = p.AND(
    p.hasTagName('link'),
    p.OR(
        p.hasAttrValue('rel', 'import'),
        p.hasAttrValue('rel', 'stylesheet')));
const styleMatcher = p.AND(
    p.hasTagName('style'),
    p.OR(
        p.NOT(p.hasAttr('type')),
        p.hasAttrValue('type', 'text/css')));


/**
 * When compiling ES6 classes down to ES5 we need to include a special form of
 * the webcomponents loader to be compatible with native custom elements. This
 * includes moving the loader script element and all relevent siblings
 * following it into the body so that the Custom Elements ES5 adapter can be
 * properly injected.
 *
 * NOTE(fks) 03-28-2017: Comments are not currently moved to the body, which
 * means relevent comments may be left behind in the head. This is fine for now,
 * but may break if we ever decide to support important metadata in comments
 * (ex: support for defining lazy-imports via HTML comments).
 *
 * TODO(fks) 03-28-2017: Move into polymer-build and add tests.
 */
export class UseES5WebcomponentsLoader extends stream.Transform {
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

    if (!webcomponentsLoaderRegex.test(contents)) {
      callback(null, file);
      return;
    }

    const parsed = parse5.parse(contents);
    const script = dom5.nodeWalk(parsed, webcomponentsLoaderMatcher);
    if (!script) {
      callback(null, file);
      return;
    }

    // Collect important dom references & create fragment for injection
    const correctedFile = file.clone();
    const bodyElement = dom5.query(parsed, bodyMatcher)!;
    const headElement = dom5.query(parsed, headMatcher)!;
    const loaderScriptUrl = dom5.getAttribute(script, 'src')!;
    const adapterScriptUrl =
        url.resolve(loaderScriptUrl, 'custom-elements-es5-adapter.js');
    const loaderMovedComment = dom5.constructors.comment(
        ' AUTO-GENERATED BY JS-COMPILE: "webcomponents-loader.js" and ' +
        'related resources have been moved to <body> so that ' +
        '"custom-elements-es5-adapter.js" polyfill could be properly ' +
        'injected into this file. ');
    const es5AdapterScript = parse5.parseFragment(`
<div id="autogenerated-ce-es5-shim">
  <script type="text/javascript">
    // This prevents custom-elements-es5-adapter.js from parsing & running
    // on browsers without native support for ES2015+ & custom elements.
    if (!window.customElements) {
      var ceShimContainer = document.querySelector('#autogenerated-ce-es5-shim');
      ceShimContainer.parentElement.removeChild(ceShimContainer);
    }
  </script>
  <script type="text/javascript" src="${adapterScriptUrl}"></script>
</div>
`);

    // If script is in the body, just insert the es5 adapter script before it
    if (dom5.nodeWalkAncestors(script, bodyMatcher)) {
      dom5.insertBefore(bodyElement, script, es5AdapterScript);
      correctedFile.contents = new Buffer(parse5.serialize(parsed), 'utf-8');
      callback(null, correctedFile);
      return;
    }

    // otherwise we need to move the webcomponents-loader/webcomponents-lite
    // loader down to the body so that the es5 adaperter script shim will work
    const scriptSiblings = dom5.queryAll(
        script.parentNode!,
        p.OR(scriptMatcher, styleMatcher, linkMatcher));
    const scriptSiblingsFollowing =
        scriptSiblings.splice(scriptSiblings.indexOf(script));
    dom5.insertBefore(headElement, script, loaderMovedComment);
    if (!bodyElement.childNodes) {
      bodyElement.childNodes = [];
    }
    for (let i = 1, len = scriptSiblingsFollowing.length; i <= len; i++) {
      const releventScript = scriptSiblingsFollowing[len - i];
      dom5.insertBefore(
          bodyElement, bodyElement.childNodes[0] || null, releventScript);
    }
    dom5.insertBefore(
        bodyElement, bodyElement.childNodes[0] || null, es5AdapterScript);

    correctedFile.contents = new Buffer(parse5.serialize(parsed), 'utf-8');
    callback(null, correctedFile);
  }
}