declare module 'polymer-build' {

  import {Node} from 'dom5';
  import {Transform} from 'stream';
  import * as fs from 'fs';


  /**
   * A virtual file format.
   */
  class File {
    constructor(options?: {
      cwd?: string;
      base?: string;
      path?: string;
      history?: string[];
      stat?: fs.Stats;
      contents?: Buffer | NodeJS.ReadWriteStream;
    });

    public cwd: string;
    public dirname: string;
    public basename: string;
    public base: string;
    public path: string;
    public stat: fs.Stats;
    public stem: string;
    public extname: string;
    public history: string[];
    public contents: Buffer | NodeJS.ReadableStream;
    public relative: string;
    public isBuffer(): boolean;
    public isStream(): boolean;
    public isNull(): boolean;
    public clone(opts?: { contents?: boolean, deep?:boolean }): File;

  }

  export interface SWConfig {
    cacheId?: string;
    directoryIndex?: string;
    dynamicUrlToDependencies?: {
      [property: string]: string[]
    };
    handleFetch?: boolean;
    ignoreUrlParametersMatching?: RegExp[];
    importScripts?: string[];
    logger?: Function;
    maximumFileSizeToCacheInBytes?: number;
    navigateFallback?: string;
    navigateFallbackWhitelist?: RegExp[];
    replacePrefix?: string;
    runtimeCaching?: {
      urlPattern: RegExp;
      handler: string;
      options?: {
        cache: {
          maxEntries: number;
          name: string;
        };
      };
    }[];
    staticFileGlobs?: string[];
    stripPrefix?: string;
    templateFilePath?: string;
    verbose?: boolean;
  }

  export interface ProjectOptions {
    root?: string;
    entrypoint?: string;
    shell?: string;
    fragments?: string[];
    sourceGlobs?: string[];
    includeDependencies?: string[];
  }

  export interface AddServiceWorkerOptions {
    project: PolymerProject;
    buildRoot: string;
    bundled?: boolean;
    serviceWorkerPath?: string;
    swConfig?: SWConfig;
  }

  export interface DocumentDeps {
    imports?: Array<string>;
    scripts?: Array<string>;
    styles?: Array<string>;
  }

  export interface DepsIndex {
    depsToFragments: Map<string, string[]>;
    fragmentToDeps: Map<string, string[]>;
    fragmentToFullDeps: Map<string, DocumentDeps>;
  }

  export class Bundler extends Transform {
    sharedBundleUrl: string;
  }

  export class StreamAnalyzer extends Transform {
    allFragments: string[];
    analyzeDependencies: Promise<DepsIndex>;
  }

  export function addServiceWorker(options: AddServiceWorkerOptions):
      Promise<{}>;

  export function forkStream(stream: NodeJS.ReadableStream):
      NodeJS.ReadableStream;

  export class PolymerProject {
    root: string;
    entrypoint: string;
    shell: string;
    fragments: string[];
    sourceGlobs: string[];
    includeDependencies: string[];

    allSourceGlobs: string[];
    analyzer: StreamAnalyzer;
    bundler: Bundler;

    constructor(options?: ProjectOptions);
    sources(): NodeJS.ReadableStream;
    dependencies(): NodeJS.ReadableStream;
    splitHtml(): Transform;
    rejoinHtml(): Transform;
  }

}
