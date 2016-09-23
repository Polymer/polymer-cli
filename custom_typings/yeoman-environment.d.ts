declare module 'yeoman-environment' {
  class YeomanEnvironment {
    register(library: any, target: string);
    registerStub(generator: any, namespace: string);
    run(target: string, options: any, done: Function);
    getGeneratorsMeta(): YeomanEnvironment.GeneratorMeta[];
    lookup(callback: (error?: Error) => void);
  }

  namespace YeomanEnvironment {
    interface GeneratorMeta  {
      resolved: string;
      namespace: string;
    }
  }

  export = YeomanEnvironment;
}
