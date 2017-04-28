import * as dom5 from 'dom5';
import * as parse5 from 'parse5';
import * as stream from 'stream';
import * as url from 'url';

import File = require('vinyl');
import { getFileContents } from "./streams";

const attrValueMatches = (attrName: string, regex: RegExp) => {
  return (node: parse5.ASTNode) => {
    const attrValue = dom5.getAttribute(node, attrName);
    return attrValue != null && regex.test(attrValue);
  };
};

const p = dom5.predicates;
const scriptIncludeWebcomponentsLoader = p.AND(
    p.hasTagName('script'),
    attrValueMatches('src', /\bwebcomponents-loader\.js$/));

/**
 * When compiling to ES5 we need to inject Babel's helpers into a global so
 * that they don't need to be included with each compiled file.
 */
export class InjectBabelHelpers extends stream.Transform {

  entrypoint: string;

  constructor(entrypoint: string) {
    super({objectMode: true});
    this.entrypoint = entrypoint;
  }

  async _transform(
      file: File,
      _encoding: string,
      callback: (error?: any, file?: File) => void) {
    
    if (file.path !== this.entrypoint) {
      callback(null, file);
      return;
    }
    const contents = await getFileContents(file);
    const document = parse5.parse(contents);
    const babelHelpersScript =
        parse5.parseFragment('<script src="/__babel-helpers.min.js"></script>');
    const webComponentsLoaderScript = dom5.nodeWalk(document, scriptIncludeWebcomponentsLoader);

    if (webComponentsLoaderScript) {
      const parent = webComponentsLoaderScript.parentNode!;
      dom5.insertAfter(parent, webComponentsLoaderScript, babelHelpersScript);
    } else {
      // where's dom5.getDocumentElement? or getHead?
      const head = dom5.query(document, dom5.predicates.hasTagName('head'));
      dom5.insertNode(head, 0, babelHelpersScript);
    }

    const newFile = file.clone();
    newFile.contents = new Buffer(parse5.serialize(document), 'utf-8');
    callback(null, newFile);
  }
}
