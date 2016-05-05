declare module 'yeoman-environment' {
  class YeomanEnvironment {
    register(library: any, target: string);
    registerStub(generator: any, namespace: string);
    run(target: string, options: any, done: Function);
  }

  namespace YeomanEnvironment {
  }

  export = YeomanEnvironment;
}
