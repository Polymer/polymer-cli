# Changelog

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
