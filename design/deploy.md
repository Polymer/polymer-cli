# Deploy

A proposal to add support for hosting service deployment to the Polymer CLI.

## Goals
- Provide new users with a fast way to get a project hosted online.
- Provide advanced users with an initial bootstrap for more advanced deployments.
- Demonstrate the [PRPL](https://www.polymer-project.org/2.0/toolbox/server) pattern where HTTP/2 Server Push is available.

## Non-goals
- Do not try to support every possible deployment environment and configuration, or even a lot of them. Just enough to get users started.

## Design

- Add an `--environment` flag.
  - Every command knows that it's being run in the context of this environment.
  - Under the `default` environment, all commands operate as they do today.
  - Under other environments:
     - `build` now outputs the boilerplate needed to deploy the project to a given service, in addition to the traditional app build output.
     - `serve` runs an appropriate HTTP server that emulates the configured hosting environment, instead of polyserve.

- Add an `environments` section to `polymer.json`.
  - **name**: The name of this environment.
  - **type**: The type of hosting environment: `app-engine`, `gh-pages`, etc.
  - Additional type-specific configuration (examples below).
  - We could also treat environments as a special case of the existing build concept, and include them in the `build` section.

- Add a `deploy` command.
  - Pushes to the hosting service for the current environment.
  - Under the `default` environment, offers to help set up a deploy environment.
     - Could have an `init`-style menu to choose from the available types.
  - With the `--open` flag, also opens a browser (same as `serve`).
  - Print the commands we're running so that users can do it themselves.

## Environments

### App Engine

- Has a [free tier](https://cloud.google.com/free/).

- Supports Node.js flex environment.

- Custom `polymer.json` environment configuration:
  - **project_id**: The App Engine project ID to deploy to.

- `build`

  - Runs both a bundled and unbundled standard build.

  - `app.yaml`
     - Mostly just specifies the `nodejs` runtime.

  - `package.json`
     - Note: this can't be the same as the existing *project* `package.json`.  This config defines a specific AppEngine deployment. It has different dependencies to the project, sets the deployed node version, etc.

  - `server.js`
     - An express HTTP server.
     - Not polyserve, because it is a bit heavy with development-oriented features. Prefer something as simple as possible since we'd like users to understand it completely.
     - Implementation is stamped out from a Yeoman template (as opposed to e.g. a binary dependency and generated config file) so that it's easy to customize later.
     - Serves the main file from all URLs.
     - Serves bundled or unbundled depending on client capabilities.
     - Supports server push manifest.
         - Could we factor out polyserve's push manifest support as an express middleware in a separate repo?
     - Note: App Engine also supports a built-in static file server configurable directly in `app.yaml`. This is what the [Polymer App Toolbox tutorial](https://www.polymer-project.org/2.0/start/toolbox/deploy#deploy-with-appengine) demonstrates. It would support serving the main file from all URLs, but it not Server Push or User-Agent switching behavior. To show off PRPL we need to include a custom server.

- `serve`
  - Runs `build`, `npm install`, and `npm start`.
     - App Engine will give us the Node.js runtime version configured in `package.json` `engines`, but it might not match what the user has installed locally, so behavior could theoretically differ. `npm` should warn if they mismatch, which is probably good enough. The `--engine-strict` flag would make this a hard error.
     - Note: `dev_appserver.py` does not support the nodejs flex runtime. This wouldn't buy us anything anyway, since flex environments are docker containers with standard runtimes.

- `deploy`
  - Runs `build`, `npm install`, and `gcloud app deploy --project="$PROJECT_ID"`.
  - The user will have had to have installed the [Cloud SDK](https://cloud.google.com/sdk/downloads) and run `gcloud init` to save local credentials. From that point on, the `gcloud` command authenticates automatically. We can provide these instructions on screen if `gcloud` is not found or fails.

### GitHub Pages

- Free up to [usage limits](https://help.github.com/articles/what-is-github-pages/#usage-limits).

- Custom `polymer.json` environment configuration:
  - **repository**: The git repository to push to.

- `build`
  - Runs a fully bundled standard build, since we don't have Server Push.

- `serve`
  - Runs some basic off-the-self static file server. It should not support serving the main file from all URLs, Server Push, or other advanced features that GitHub Pages doesn't support.

- `deploy`
  - Runs `build`, clones the configured repo to a temporary directory, replaces the `gh-pages` branch, and pushes.
  - Could use [tschaub/gh-pages](https://github.com/tschaub/gh-pages) library.

### Other enviroments

In the future we might also want to support:

- Firebase
- Apache
- Nginx
