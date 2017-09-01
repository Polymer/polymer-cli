# Changelog

## Unreleased
<!-- Add new, unreleased items here. -->

## v1.5.4 [08-31-2017]
- Upgraded web-component-tester to v6.1.5 to address IE11 issues.

## v1.5.3 [08-31-2017]
- Upgraded web-component-tester to v6.1.4 to address IE11 issues.

## v1.5.2 [08-26-2017]
- Upgraded web-component-tester to v6.1.3 to address yarn installation issues.

## v1.5.1 [08-22-2017]
- Upgraded web-component-tester to v6.1.2.

## v1.5.0 [08-22-2017]
- Fix issue where the `--fragment` flag was being ignored.
- Added support for `polymer test --npm` option.

## v1.4.1 [08-10-2017]
- Fixed the `polymer serve --npm` option.

## v1.4.0 [08-08-2017]
- Upgraded to Polymer Build ^2.0.0 which uses Polymer Bundler ^3.0.0.
- When no specific option is set for Bundler's `rewriteUrlsInTemplates` the CLI attempts to get the version of Polymer for the project using `bower`.  When Polymer 2.x is discovered, `rewriteUrlsInTemplates` is defaulted to `false`.  In case of Polymer 1.x or where version can not be identified, it defaults to `true`.  Any user settings override these defaults.
- Fix issue where negative `extraDependencies` globs were not working.
- test: Add support for WCT `config-file` option.

## v1.3.1 [07-06-2017]
- Fixed [issue #710](https://github.com/Polymer/polymer-cli/issues/710) where the es5 custom elements adapter would not be added when bundling.
- Fixed [issue #767](https://github.com/Polymer/polymer-cli/issues/767) where hyphenated option names for `build` command were effectively ignored.

## v1.3.0 [06-30-2017]
- Added support for optional polymer-project-config provision of bundler options instead of only boolean value for the `bundle` property of build definitions.  See the [Polymer Project Config 3.4.0 release notes](https://github.com/Polymer/polymer-project-config/pull/37) for details on new options available in polymer.json.
- Includes Polymer Build fixes to push-manifest generation and others.  See [Polymer Build 1.6.0 release notes](https://github.com/Polymer/polymer-build/pull/249).
- Includes Polymer Bundler fixes to shell strategy and others.  See [Polymer Bundler 2.2.0 release notes](https://github.com/Polymer/polymer-bundler/pull/573).

## v1.2.0 [06-12-2017]
- Updated lint rule to `polymer-2` in the `polymer-2-element` template.
- Drop 1.x init templates. Bump `shop` init template to latest version.

## v1.1.0 [05-23-2017]
- Updated dependency on latest polymer-project-config so that bundled presets include prefetch link generation.
- `build` Entrypoints will now be properly cached by generated service workers, and assets will be fetched by service workers using relative URLs to support apps mounted at non-root host paths.
- `build` The `basePath` option no longer adds a prefix to service workers or push manifests. Relative URLs are used instead.

## v1.0.2 [05-19-2017]
- Updates dependencies on latest polymer-build and polymer-bundler to reduce extraneous html tag output when bundling and generating prefetch links.

## v1.0.1 [05-18-2017]
- Update element and application templates to latest stable versions
- Prefetch links are now compatible with bundler and differential serving w/ base tag hrefs in entrypoint documents.

## v1.0.0 [05-16-2017]
- Official 1.0.0 release of the Polymer CLI! 🎉
- `build` Support for new `basePath` build config option that remaps paths to assist in serving at non-root paths, such as when doing differential serving of multiple builds from the same host. Affects service worker generation, push manifest generation, and also updates the entrypoint's `<base>` tag if found.
- `build` Building your project will now write a copy of your `polymer.json` to the build directory. This provides a log of the build options used at the time, including expansion of presets.

## v0.18.4 [05-15-2017]
- Updated dependencies to support official `polymer-analyzer` 2.0.0 and `web-components-tester` 6.0.0 releases.

## v0.18.3 [05-12-2017]
- Fix the CLI preset flag.
- Fix an issue where compiling JS would crash in versions of node with native async iterators.
- `bundle` no longer emits any JS or CSS files which have been inlined into bundles.

## v0.18.2 [05-10-2017]

- `build` Support build configuration "presets".
- `build` Performance improvements, including reduction of extraneous insertions of html, head and body tags.
- `bundle` has many bug fixes and support for lazy imports.
- Update polyserve to 0.19.0 which adds HTTP compression and JS compilation for Mobile Safari and Vivaldi browsers.
- Produce much smaller output when compiling many JS files to ES5 by inserting babel helpers only once, at the toplevel entrypoint.

- `init`: Propagate `description` from `init` to application templates in `index.html` meta tag.

- **New Command Aliases**: Commands now support aliases. `polymer install` has been aliased under `polymer i`.

## v0.18.1 [04-25-2017]

- `init` small template fixes.
- `serve` now respects the `entrypoint` configured in `polymer.json`.
- Remove ability to run a locally installed version of the CLI if it exists in the current working directory. This unexpected behavior was never documented but some users could be running an incorrect version of the CLI as a result.
- Update Node.js version pre-run check to match latest supported versions.

## v0.18.0 [04-13-2017]

v0.18.0 contains our latest work to support both Polymer 1.x & 2.0 projects. There are a bunch of big new features included in this update, as well as several breaking changes since the latest version. Here is a quick summary of the major changes for anyone who is updating from our previous `latest`/`v0.17.0` version:

- **New Polymer 2.0 Templates**: `polymer init` has added new Polymer 2.0 templates for starter elements, applications, and our latest Polymer Starter Kit & Shop applications. Run `polymer init` to see the whole list.
- **Updated `lint` Command**: `polymer lint` is now powered by our newest version of [polymer-linter](https://github.com/Polymer/polymer-linter). The new linter can show you the exact location of any problems in your code, and is much more configurable. Run `polymer help lint` for more information.
- **Updated `build` Command**: `polymer build` is now powered by our newest version of [polymer-build](https://github.com/Polymer/polymer-linter), which provides even more optimizations and features for customizing your build. Run `polymer help build` for more information.
- **New Build Output**: The biggest change to `polymer build` behavior is that it no longer defaults to outputting two, optimized build targets. The new default behavior is to generate a single `/build/default` directory with all configurable optimizations turned off by default. To customize your build(s) and include different optimizations, you can either include CLI flags (like `--js-compile`) or custom polymer.json build configurations. See the latest [polymer.json "builds"](https://www.polymer-project.org/2.0/docs/tools/polymer-json#builds) specification for more information.
- **New `analyze` Command:** Generates a JSON blob of metadata about your element(s). This can be useful to have for tooling and analysis.
- **New `install` Command:** Like `bower install`, but with support for installing "variants" as defined in your `bower.json`. See [the glossary](https://www.polymer-project.org/2.0/docs/glossary#dependency-variants) for more information.
- Remove Node v4 support: Node v4 is no longer in Active LTS, so as per the [Polymer Tools Node.js Support Policy](https://www.polymer-project.org/2.0/docs/tools/node-support) the Polymer CLI will not support Node v4 going forward. Please update to Node v6 or later to continue using the latest verisons of Polymer tooling.

<details>
  <summary><strong>See the Full v0.18.0 Pre-Release Changelog</strong></summary><p>

#### v0.18.0 [04-13-2017]

- `build`: Add `--add-push-manifest`/`addPushManifest` option for generating a [`push-manifest.json`](https://github.com/GoogleChrome/http2-push-manifest) file for your project.
- `build`: Fix a bug where `--insert-prefetch-links` would generate 404ing imports.
- `build`: Update automatic `webcomponentsjs` polyfilling to move it and all affected elements following it into the body so that the `custom-elements-es5-adapter.js` can work properly in IE11. (See [#627](https://github.com/Polymer/polymer-cli/issues/627))
- `init`: Init template elements now properly inherit from the given element/app name.
- `init`: Fix `polymer-2-element` template serving by removing iron-component-page until it can support Polymer 2.0 class-based elements.
- `init`: Update polymer 2.0 application & element tests to improve and fix broken tests.
- `init`: Update polymer 1.x application & element template WCT dependency to `^6.0.0-prerelease.5`.
- `init`: Update polymer application & element READMEs.
- `serve`: Update to polyserve@v0.17.0 to support autocompilation when serving to Chromium, Edge browsers.
- [Breaking] Remove Node v4 support: Node v4 is no longer in Active LTS, so as per the [Polymer Tools Node.js Support Policy](https://www.polymer-project.org/2.0/docs/tools/node-support) the Polymer CLI will not support Node v4. Please update to Node v6 or later to continue using the latest verisons of Polymer tooling.

#### v0.18.0-pre.15 [03-22-2017]

- `build`: Update automatic `webcomponentsjs` polyfilling to use `custom-elements-es5-adapter.js` instead of broken `webcomponents-es5-loader.js`. Fixes compiled, bundled builds in Chrome. (See [#605](https://github.com/Polymer/polymer-cli/issues/605))

#### v0.18.0-pre.14 [03-20-2017]

- The experimental linter has graduated to be the new default. Removed `polymer experimental-lint` command. `polymer lint` now runs [polymer-linter](https://github.com/Polymer/polymer-linter). See the README and `polymer lint --help` for more info.

#### v0.18.0-pre.13 [03-08-2017]

- When running `polymer build` and compiling JS to ES5, we will also rewrite script includes of `webcomponents-loader.js` to `webcomponents-es5-loader.js`.

#### v0.18.0-pre.12 [03-07-2017]

- Add PSK 3.0 (Polymer 2.0 Polymer Starter Kit) template to the init command.
- Automatically include un-optimized `webcomponentsjs` polyfills in builds.
- Update Polymer Analyzer, Polymer Bundler and Polymer Linter dependencies
  - Bundles now include optimizations specified in builds.
  - Much more detailed output of `analyze` command.

#### v0.18.0-pre.10 [02-21-2017]

- **New `build` Behavior**: New build options have been added to give you more control over the generated build. These options can be defined in your project's `polymer.json`, or via CLI flags. Run `polymer build --help` to see a list of new supported CLI flags.
  - **Previously default behaviors (minifying JavaScript, generating service workers, etc) are now turned off by default.**
  - Multiple builds can now be defined in your project's `polymer.json`. See [the latest documentation](https://github.com/Polymer/docs/blob/ff74953fa93ad41d659a6f5a14c5f7072368edbd/app/2.0/docs/tools/polymer-json.md#builds) for information on configuring your project build(s).
- `init`: Add new 2.0 polymer element & application templates.
- Update dependencies.
- **New `experimental-lint` command**: configurable with per-project rulesets, either with cli args or in your polymer.json. Will soon replace the `lint` command, for now run it as `polymer experimental-lint`. Specify "polymer-2", "polymer-2-hybrid", or "polymer-1" to customize the lint warnings that you receive. Run `polymer help experimental-lint` for more detail.

#### v0.18.0-alpha.9

- Fixed a bug where `polymer init` would crash if run from a folder with a
  package.json that's missing a name property. https://github.com/Polymer/polymer-cli/issues/186
- Fixed a bug where `polymer build` wouldn't analyze behaviors correctly.
- Fixed a bug where `polymer test` would complain about the version of wct it was bundled with.
- Updated dependencies.

#### v0.18.0-alpha.8

- Updated dependencies.

#### v0.18.0-alpha.7

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

</p></details>

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
