import * as dom5 from 'dom5';
import {fs} from 'mz';
import * as parse5 from 'parse5';
import * as path from 'path';
import * as stream from 'stream';

import {getFileContents} from './streams';

import File = require('vinyl');


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

    const babelHelpersFragment = parse5.parseFragment('<script></script>\n');
    dom5.setTextContent(
        babelHelpersFragment.childNodes![0]!,
        fs.readFileSync(path.join(__dirname, 'babel-helpers.min.js'), 'utf-8'));

    const firstScript =
        dom5.nodeWalk(document, dom5.predicates.hasTagName('script'));
    if (firstScript) {
      dom5.insertBefore(
          firstScript.parentNode!, firstScript, babelHelpersFragment);
    } else {
      const head =
          dom5.query(document, dom5.predicates.hasTagName('head')) || document;
      dom5.append(head, babelHelpersFragment);
    }

    const newFile = file.clone();
    newFile.contents = new Buffer(parse5.serialize(document), 'utf-8');
    callback(null, newFile);
  }
}
