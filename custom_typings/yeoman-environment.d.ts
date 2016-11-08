declare module 'yeoman-environment' {
  class YeomanEnvironment {
    register(library: any, target: string): string;
    registerStub(generator: any, namespace: string): any;
    run(target: string, options: any, done: Function): void;
    getGeneratorsMeta(): {[name: string]: YeomanEnvironment.GeneratorMeta};
    lookup(callback: (error?: any) => void): void;
  }

  namespace YeomanEnvironment {
    interface GeneratorMeta  {
      resolved: string;
      namespace: string;
    }
  }

  export = YeomanEnvironment;
}
