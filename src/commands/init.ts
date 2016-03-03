import {Command} from './command';
import * as YeomanEnvironment from 'yeoman-environment';
import * as PolymerInit from 'generator-polymer-init/generators/app';

export class InitCommand implements Command {
  name = 'init';

  description = 'Initializes a Polymer project';

  args = [];

  run(options): Promise<any> {
    return new Promise((resolve, reject) => {
      let env = new YeomanEnvironment();
      env.register(require.resolve('generator-polymer-init'), 'polymer-init:app');
      env.run('polymer-init', {}, () => resolve());
    });
  }
}
