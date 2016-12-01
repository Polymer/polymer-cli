declare module 'bower' {

  // This really should be in module 'bower-config', but we don't directly
  // import it yet.
  export interface Config {
    color?: boolean;
    cwd?: string;
    directory?: string;
    interactive?: boolean;
    save?: boolean;
  }

  export const commands: {
    install(packages: string[], installOptions: {}, config: Config):
        NodeJS.EventEmitter;
  };

  export const config: Config;

  export type LogData = Warning|Conflict;

  export interface Warning {
    level: 'warn';
    id: string;
    message: string;
    // data: any;
  }
  export interface Conflict {
    level: 'conflict';
    id: 'incompatible'|string;
    message: string;
    data: {
      // Name of package with conflict
      name: string; picks: Pick[];
    }
  }

  export interface Pick {
    /** This is the package request. */
    endpoint: {
      name: string;
      /** repo */
      source: string;
      /** version name */
      target: string;
    };
    /** local path to temporary dir on filesystem */
    canonicalDir: string;
    /** This is the bower.json of the package that was resolved */
    pkgMeta: {
      name: string; version: string;

      // lot of stuff here we don't care about...
      /*
      main: [Object];
      license: string;
      ignore: [Object];
      authors: [Object];
      repository: [Object],
      dependencies: [Object],
      devDependencies: [Object],
      private: true,
      homepage: 'https://github.com/Polymer/polymer',
      _release: '1.7.0',
      _resolution: [Object],
      _source: 'https://github.com/Polymer/polymer.git',
      _target: '>=1.0.8'
      */
    },
  }
}

declare module 'bower/lib/config' {
  import {Config} from 'bower';
  const defaultConfig: (config: any) => Config;
  export = defaultConfig;
}

declare module 'bower/lib/renderers/StandardRenderer' {
  import {Config, LogData} from 'bower';
  class StandardRenderer {
    constructor(command: string, config: Config);
    log(data: LogData): void;
    end(data: any): void;
    error(error: Error): void;
  }
  export = StandardRenderer;
}

declare module 'bower/lib/core/Project' {
  import {Config} from 'bower';
  import Logger = require('bower-logger');
  class Project {
    constructor(config: Config, logger: Logger);
    install(endpoints: string[], options: any, config: Config): void;
  }
  export = Project;
}
