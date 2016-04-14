declare module 'yeoman-environment' {
  class YeomanEnvironment {
    register(library: any, target: string);
    run(target: string, options: any, done: Function);
  }

  export = YeomanEnvironment;
}
