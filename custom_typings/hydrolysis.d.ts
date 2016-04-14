declare module 'hydrolysis' {
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
  export class Analyzer {
    static analyze(path: string, options: Options): Promise<Analyzer>;
    metadataTree(path: string): Promise<void>;
    annotate(): void;
    elements: Element[];
    behaviors: Behavior[];
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
  class FSResolver {
    constructor(options: any);
  }
}
