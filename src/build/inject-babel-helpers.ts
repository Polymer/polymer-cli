import * as dom5 from 'dom5';
import {fs} from 'mz';
import * as parse5 from 'parse5';
import * as path from 'path';

import {AsyncTransformStream, getFileContents} from './streams';

import File = require('vinyl');

const p = dom5.predicates;

const scriptOrImport = p.OR(
    p.hasTagName('script'),
    p.AND(p.hasTagName('link'), p.hasSpaceSeparatedAttrValue('rel', 'import')));



/**
 * When compiling to ES5 we need to inject Babel's helpers into a global so
 * that they don't need to be included with each compiled file.
 */
export class BabelHelpersInjector extends AsyncTransformStream<File, File> {
  constructor(private entrypoint: string) {
    super({objectMode: true});
  }

  protected async * _transformIter(files: AsyncIterable<File>) {
    for
      await(const file of files) {
        yield await this.processFile(file);
      }
  }

  private async processFile(file: File): Promise<File> {
    if (file.path !== this.entrypoint) {
      return file;
    }
    const contents = await getFileContents(file);
    const document = parse5.parse(contents);

    const babelHelpersFragment =
        parse5.parseFragment('\n\n<script></script>\n\n');
    dom5.setTextContent(
        babelHelpersFragment.childNodes![1]!,
        await fs.readFile(
            path.join(__dirname, 'babel-helpers.min.js'), 'utf-8'));

    const firstScriptOrImport = dom5.nodeWalk(document, scriptOrImport);
    if (firstScriptOrImport) {
      dom5.insertBefore(
          firstScriptOrImport.parentNode!,
          firstScriptOrImport,
          babelHelpersFragment);
    } else {
      const head =
          dom5.query(document, dom5.predicates.hasTagName('head')) || document;
      dom5.append(head, babelHelpersFragment);
    }

    const newFile = file.clone();
    newFile.contents = new Buffer(parse5.serialize(document), 'utf-8');
    return newFile;
  }
}
