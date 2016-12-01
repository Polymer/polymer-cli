declare module 'bower' {
  export interface Config { interactive?: boolean; }
  export const commands: {
    install(packages: string[], installOptions: {}, config: Config):
        NodeJS.EventEmitter;
  };
}
