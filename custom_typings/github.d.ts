import Github = require('github');

declare module "github" {

  class Github {
    repos: {
      getReleases(params: Github.ReposGetReleasesParams, callback?: Github.Callback): Promise<any>;
    }
  }
  interface Release {
    url: string,
    name: string,
    tag_name: string,
    id: number,
    tarball_url: string,
  }
}
