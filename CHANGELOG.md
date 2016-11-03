# Changelog

## Upcoming (Potentially Breaking)

- Upgrade `polymer-build` to `v0.5.0`, which means the build command will now use the new [`polymer-analyzer`](https://github.com/Polymer/polymer-analyzer)! See [the polymer-build changelog](https://github.com/Polymer/polymer-build/blob/v0.5.0/CHANGELOG.md) for more information.
- `build`: Rename the `--include-dependencies` flag to `--extra-dependencies`
- `polymer.json`: Rename the `includeDependencies` & `sourceGlobs` fields to `extraDependencies` & `sources`, respectively

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
