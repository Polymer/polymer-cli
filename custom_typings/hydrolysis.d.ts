declare module 'hydrolysis' {
  import {Node} from 'dom5';
  interface Options {
    filter?: (path: string) => boolean;
  }
  interface Element {
    is: string;
    contentHref: string;
    desc?: string;
  }
  interface Behavior {
    is: string;
    contentHref: string;
    desc?: string;
  }

  /**
   * The metadata for all features and elements defined in one document
   */
  interface DocumentDescriptor {
    /**
     * The elements from the document.
     */
    // elements: ElementDescriptor[];

    /**
     * The features from the document
     */
    // features: FeatureDescriptor[];

    /**
     * The behaviors from the document
     */
    // behaviors: BehaviorDescriptor[];

    href?: string;

    imports?: DocumentDescriptor[];

    // parsedScript?: estree.Program;

    html?: {
      script: Node[],
      style: Node[],
      ast: Node
    };
  }

  /**
   * The metadata of an entire HTML document, in promises.
   */
  interface AnalyzedDocument {
    /**
     * The url of the document.
     */
    href: string;
    /**
     * The parsed representation of the doc. Use the `ast` property to get
     * the full `parse5` ast.
     */
    // htmlLoaded: Promise<ParsedImport>;

    /**
     * Resolves to the list of this Document's transitive import dependencies.
     */
    depsLoaded: Promise<string[]>;

    /**
     * The direct dependencies of the document.
     */
    depHrefs: string[];
    /**
     * Resolves to the list of this Document's import dependencies
     */
    metadataLoaded: Promise<DocumentDescriptor>;
  }

  export class Analyzer {
    static analyze(path: string, options: Options): Promise<Analyzer>;

    constructor(attachAST: boolean, loader: Loader);

    metadataTree(path: string): Promise<DocumentDescriptor>;
    annotate(): void;
    elements: Element[];
    behaviors: Behavior[];
    html: {[path: string]: AnalyzedDocument};
    parsedDocuments: {[path: string]: Node};

    load(href: string):Promise<AnalyzedDocument>;

    _getDependencies(
        href: string,
        found?: {[url:string]: boolean},
        transitive?: boolean)
      : Promise<string[]>
  }
// }
// declare module 'hydrolysis/loader/resolver' {
  export class Deferred<T> {
    promise: Promise<T>;
    resolve: (val:(T|PromiseLike<T>))=>void;
    reject: (err:any)=>void;
  }

  /**
   * An object that knows how to resolve resources.
   */
  export interface Resolver {
    /**
     * Attempt to resolve `deferred` with the contents the specified URL. Returns
     * false if the Resolver is unable to resolve the URL.
     */
    accept(path:string, deferred:Deferred<string>):boolean;
  }

  class FSResolver implements Resolver {
    constructor(options: any);
    accept(path:string, deferred:Deferred<string>):boolean;
  }

  export class Loader {
    resolvers: Resolver[];
    addResolver(resolver:Resolver): void;
    request(uri:string): Promise<string>;
  }
}
