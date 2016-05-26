/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

import * as dom5 from 'dom5';
import {posix as posixPath} from 'path';
import * as osPath from 'path';
import * as logging from 'plylog';
import {Transform} from 'stream';
import File = require('vinyl');

const logger = logging.getLogger('cli.build.html-project');
const pred = dom5.predicates;

const extensionsForType = {
  'text/ecmascript-6': 'js',
  'application/javascript': 'js',
  'text/javascript': 'js',
  'application/x-typescript': 'ts',
  'text/x-typescript': 'ts',
};

/**
 * Splits and rejoins inline scripts and styles from HTML files.
 *
 * Use `HtmlProject.prototype.split` and `HtmlProject.prototype.rejoin` to
 * surround processing steps that operate on the extracted resources.
 * HtmlProject works well with gulp-if to process files based on filename.
 */
export class HtmlProject {

  _splitFiles: Map<string, SplitFile> = new Map();
  _parts: Map<string, SplitFile> = new Map();
  split = new Splitter(this);
  rejoin = new Rejoiner(this);

  isSplitFile(parentPath: string): boolean {
    return this._splitFiles.has(parentPath);
  }

  getSplitFile(parentPath: string): SplitFile {
    let splitFile = this._splitFiles.get(parentPath);
    if (!splitFile) {
      splitFile = new SplitFile(parentPath);
      this._splitFiles.set(parentPath, splitFile);
    }
    return splitFile;
  }

  addSplitPath(parentPath: string, childPath: string): void {
    let splitFile = this.getSplitFile(parentPath);
    splitFile.addPartPath(childPath);
    this._parts.set(childPath, splitFile);
  }

  getParentFile(childPath: string): SplitFile {
    return this._parts.get(childPath);
  }

}


/**
 * Represents a file that is split into multiple files.
 */
class SplitFile {
  path: string;
  parts: Map<string, string> = new Map();
  outstandingPartCount = 0;
  vinylFile: File = null;

  constructor(path: string) {
    this.path = path;
  }

  addPartPath(path: string): void {
    this.parts.set(path, null);
    this.outstandingPartCount++;
  }

  setPartContent(path: string, content: string): void {
    console.assert(this.parts.get(path) === null);
    console.assert(this.outstandingPartCount > 0);
    this.parts.set(path, content);
    this.outstandingPartCount--;
  }

  get isComplete(): boolean {
    return this.outstandingPartCount === 0 && this.vinylFile != null;
  }
}

/**
 * Splits HTML files, extracting scripts and styles into separate `File`s.
 */
class Splitter extends Transform {

  static isInlineScript = pred.AND(
    pred.hasTagName('script'),
    pred.NOT(pred.hasAttr('src'))
  );

  _project: HtmlProject;

  constructor(project) {
    super({objectMode: true});
    this._project = project;
  }

  _transform(file: File, encoding: string, callback: (error?, data?) => void): void {
    let filePath = osPath.normalize(file.path);
    if (file.contents && filePath.endsWith('.html')) {
      try {
        let contents = file.contents.toString();
        let doc = dom5.parse(contents);
        let body = dom5.query(doc, pred.hasTagName('body'));
        let head = dom5.query(doc, pred.hasTagName('head'));
        let scriptTags = dom5.queryAll(doc, Splitter.isInlineScript);
        let styleTags = dom5.queryAll(doc, pred.hasTagName('style'));

        let scripts = [];
        let styles = [];

        for (let i = 0; i < scriptTags.length; i++) {
          let scriptTag = scriptTags[i];
          let source = dom5.getTextContent(scriptTag);
          let typeAtribute = dom5.getAttribute(scriptTag, 'type');
          let extension = typeAtribute && extensionsForType[typeAtribute] || 'js';
          let childFilename = `${osPath.basename(filePath)}_script_${i}.${extension}`;
          let childPath = osPath.join(osPath.dirname(filePath), childFilename);
          scriptTag.childNodes = [];
          dom5.setAttribute(scriptTag, 'src', childFilename);
          let scriptFile = new File({
            cwd: file.cwd,
            base: file.base,
            path: childPath,
            contents: new Buffer(source),
          });
          this._project.addSplitPath(filePath, childPath);
          this.push(scriptFile);
        }

        let splitContents = dom5.serialize(doc);
        let newFile = new File({
          cwd: file.cwd,
          base: file.base,
          path: filePath,
          contents: new Buffer(splitContents),
        });
        callback(null, newFile);
      } catch (e) {
        callback(e, null);
      }
    } else {
      callback(null, file);
    }
  }
}

/**
 * Joins HTML files split by `Splitter`.
 */
class Rejoiner extends Transform {

  static isExternalScript = pred.AND(
    pred.hasTagName('script'),
    pred.hasAttr('src')
  );

  _project: HtmlProject;

  constructor(project) {
    super({objectMode: true});
    this._project = project;
  }

  _transform(file: File, encoding: string, callback: (error?, data?) => void): void {
    let filePath = osPath.normalize(file.path);
    if (this._project.isSplitFile(filePath)) {
      // this is a parent file
      let splitFile = this._project.getSplitFile(filePath);
      splitFile.vinylFile = file;
      if (splitFile.isComplete) {
        callback(null, this._rejoin(splitFile));
      } else {
        splitFile.vinylFile = file;
        callback();
      }
    } else {
      let parentFile = this._project.getParentFile(filePath);
      if (parentFile) {
        // this is a child file
        parentFile.setPartContent(filePath, file.contents.toString());
        if (parentFile.isComplete) {
          callback(null, this._rejoin(parentFile));
        } else {
          callback();
        }
      } else {
        callback(null, file);
      }
    }
  }

  _rejoin(splitFile: SplitFile) {
    let file = splitFile.vinylFile;
    let filePath = osPath.normalize(file.path);
    let contents = file.contents.toString();
    let doc = dom5.parse(contents);
    let body = dom5.query(doc, pred.hasTagName('body'));
    let head = dom5.query(doc, pred.hasTagName('head'));
    let scriptTags = dom5.queryAll(doc, Rejoiner.isExternalScript);
    let styleTags = dom5.queryAll(doc, pred.hasTagName('style'));

    for (let i = 0; i < scriptTags.length; i++) {
      let scriptTag = scriptTags[i];
      let srcAttribute = dom5.getAttribute(scriptTag, 'src');
      let scriptPath = osPath.join(osPath.dirname(splitFile.path), srcAttribute);
      if (splitFile.parts.has(scriptPath)) {
        let scriptSource = splitFile.parts.get(scriptPath);
        dom5.setTextContent(scriptTag, scriptSource);
        dom5.removeAttribute(scriptTag, 'src');
      }
    }

    let joinedContents = dom5.serialize(doc);

    return new File({
      cwd: file.cwd,
      base: file.base,
      path: filePath,
      contents: new Buffer(joinedContents),
    });

  }
}
