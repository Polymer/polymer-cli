# Changelog

## v0.18.0-pre.13 [03-08-2017]

- When running `polymer build` and compiling JS to ES5, we will also rewrite script includes of `webcomponents-loader.js` to `webcomponents-es5-loader.js`.

## v0.18.0-pre.12 [03-07-2017]

- Add PSK 3.0 (Polymer 2.0 Polymer Starter Kit) template to the init command.
- Automatically include un-optimized `webcomponentsjs` polyfills in builds.
- Update Polymer Analyzer, Polymer Bundler and Polymer Linter dependencies
  - Bundles now include optimizations specified in builds.
  - Much more detailed output of `analyze` command.

## v0.18.0-pre.10 [02-21-2017]

- **New `build` Behavior**: New build options have been added to give you more control over the generated build. These options can be defined in your project's `polymer.json`, or via CLI flags. Run `polymer build --help` to see a list of new supported CLI flags.
  - **Previously default behaviors (minifying JavaScript, generating service workers, etc) are now turned off by default.**
  - Multiple builds can now be defined in your project's `polymer.json`. See [the latest documentation](https://github.com/Polymer/docs/blob/ff74953fa93ad41d659a6f5a14c5f7072368edbd/app/2.0/docs/tools/polymer-json.md#builds) for information on configuring your project build(s).
- `init`: Add new 2.0 polymer element & application templates.
- Update dependencies.
- **New `experimental-lint` command**: configurable with per-project rulesets, either with cli args or in your polymer.json. Will soon replace the `lint` command, for now run it as `polymer experimental-lint`. Specify "polymer-2", "polymer-2-hybrid", or "polymer-1" to customize the lint warnings that you receive. Run `polymer help experimental-lint` for more detail.

## v0.18.0-alpha.9

- Fixed a bug where `polymer init` would crash if run from a folder with a
  package.json that's missing a name property. https://github.com/Polymer/polymer-cli/issues/186
- Fixed a bug where `polymer build` wouldn't analyze behaviors correctly.
- Fixed a bug where `polymer test` would complain about the version of wct it was bundled with.
- Updated dependencies.

## v0.18.0-alpha.8

- Updated dependencies.

## v0.18.0-alpha.7

- **Added `analyze` command:** Generates a JSON blob of metadata about your element(s). Useful for tooling and analysis.
- **Added `install` command:** Installs "variants" defined in your `bower.json`.
- Upgrade `polyserve` to `v0.6.0-prerelease.6` to handle serving variants
- Upgrade `web-component-tester` to `6.0.0-prerelease.1` to handle testing variants
- Upgrade `polymer-build` to `v0.6.0-alpha.1`, which includes an upgrade to the new [`polymer-analyzer`](https://github.com/Polymer/polymer-analyzer).
- `build`: Rename the `--include-dependencies` flag to `--extra-dependencies`
- `build`: css is now minified
- `build`: Lots of bug fixes due to the new polymer-build library and analyzer.
- `polymer.json`: Rename the `includeDependencies` & `sourceGlobs` fields to `extraDependencies` & `sources`, respectively
- Added support for v7.x of Node.js, dropped support for v5.x. Please move to an [actively maintained version of Node.js](https://github.com/nodejs/LTS) for the best experience.
- Upgrade [web-component-tester 6.0](https://github.com/Polymer/web-component-tester/blob/master/CHANGELOG.md) which brings a number of breaking changes to the `test` command.
- `init`: Fix duplicate names for sub-generators in a directory

## v0.17.0

- Upgrade `web-component-tester` to `v5.0.0`, which includes a new major version of mocha. See [the wct changelog](https://github.com/Polymer/web-component-tester/blob/v5.0.0/CHANGELOG.md#500) for more details.
- Upgrade `polyserve` to `v0.13.0`. See [the polyserve changelog](https://github.com/PolymerLabs/polyserve/blob/master/CHANGELOG.md) for more details.
- `build`: Add support for relative root path in polymer.json
- `build`: clear the build directory before building (#332)
- `init`: Fix issue where the application element name always used the current working directory name by default
- `init`: Fix undefined template description
- Fix issue with command failures exiting as successes (#418)

## v0.16.0

- build: fail immediately if polymer.json is invalid
- build: Add missing support for `sourceGlobs` & `includeDependencies` in polymer.json
- polymer-build@v0.4.1 (fixes ignored `staticFileGlobs` bug)


## v0.15.0

- replace app-drawer-template with starter-kit


## v0.14.0

- replace unneccesary gulp dependency with vinyl-fs
- polymer-build@v0.4.0 fixes build path issues
- but wait... THERE'S MORE! polymer-build@v0.4.0 also handles external resources properly now
- fix bug where `--version` flag threw an exception


## v0.13.0

- Refactor build logic out into standalone library: https://github.com/Polymer/polymer-build. Build behavior should remain the same from v0.12.0, but lots of work has been done in the new library to fix bugs and reduce build time/size.
- Refactor build file optimization streams
- Send an error code on polymer command run error


## v0.12.0

- gulp-typings@2.0.0
- github@1.1.0
- Update command-line-* suite of dependency, refactor to accomodate
- Refactor init command to be more easily testable, reduce startup times
- Catch exception thrown by findup when finding gulpfiles
- Add input linting argument, and fix major bug with paths
- init: Don’t crash when a package.json is present with no name
- Speed up start time, move last of the commands to load their dependencies at runtime
- Add demo and description for element template (#229)
- specify the sync interface when searching templates for package.json
- Removes unneccesary liftoff dependency
- Add update-notify to notify users when their cli is out of date
- Add tests for init command
