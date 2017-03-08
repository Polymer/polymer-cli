import * as dom5 from 'dom5';
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

const p = dom5.predicates;
const scriptIncludeWebcomponentsLoader = p.AND(
    p.hasTagName('script'),
    attrValueMatches('src', /\bwebcomponents-loader\.js$/));

/**
 * When compiling ES6 classes down to ES5 we need to include a special form of
 * the webcomponents loader to be compatible with native custom elements.
 *
 * TODO(rictic): test this.
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
    if (!/webcomponents-loader\.js/.test(contents)) {
      callback(null, file);
      return;
    }
    const parsed = parse5.parse(contents);
    const script = dom5.nodeWalk(parsed, scriptIncludeWebcomponentsLoader);
    if (!script) {
      callback(null, file);
      return;
    }
    const scriptPath = dom5.getAttribute(script, 'src')!;
    const es5Url = url.resolve(scriptPath, 'webcomponents-es5-loader.js');
    dom5.setAttribute(script, 'src', es5Url);
    const correctedFile = file.clone();
    correctedFile.contents = new Buffer(parse5.serialize(parsed), 'utf-8');
    callback(null, correctedFile);
  }
}
