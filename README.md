[![Build Status](https://travis-ci.org/Polymer/polymer-cli.svg?branch=master)](https://travis-ci.org/Polymer/polymer-cli)
[![Build status](https://ci.appveyor.com/api/projects/status/3xc7rkapu39rw9fs/branch/master?svg=true)](https://ci.appveyor.com/project/justinfagnani/polymer-cli/branch/master)
[![NPM version](http://img.shields.io/npm/v/polymer-cli.svg)](https://www.npmjs.com/package/polymer-cli)

# Polymer CLI

The command-line tool for Polymer projects and Web Components.

## Features

  - **init** - Create a new Polymer project from pre-configured starter templates
  - **install** - Install dependencies and [dependency variants](https://www.polymer-project.org/2.0/docs/glossary#dependency-variants) via Bower
  - **serve**	- Serve elements and applications during development
  - **lint** - Lint a project to find and diagnose errors quickly
  - **test** - Test your project with [`web-component-tester`](https://github.com/Polymer/web-component-tester/)
  - **build**	- Build an application optimized for production
  - **analyze** - Generate an analyzed JSON representation of your element or application

> **For a detailed overview of the CLI, how it works and when to use it, check out the official
[Polymer CLI guide](https://www.polymer-project.org/2.0/docs/tools/polymer-cli).**
> This README will focus on the individual CLI commands and how to run them.


## Installation

```bash
$ yarn global add polymer-cli
# or...
$ npm install -g polymer-cli
```

For best results and a faster installation, we recommend installing with [yarn](https://yarnpkg.com/en/).

## Configuration

No configuration is required to use the Polymer CLI to develop a standalone element.

When developing a web application, defining some configuration is recommended. Simple applications may work with the CLI's default settings, but following the [Application Shell Architecture](https://developers.google.com/web/updates/2015/11/app-shell) for your app and manually defining an application shell and fragments will give you the best performance in production.

Here's a brief summary of the configuration options you can use to describe your web application structure:

  - [`entrypoint`](https://www.polymer-project.org/2.0/docs/tools/polymer-json#entrypoint) (Defaults to `index.html`): The main entrypoint to your app.
  - [`shell`](https://www.polymer-project.org/2.0/docs/tools/polymer-json#shell) (Optional): The app shell.
  - [`fragments`](https://www.polymer-project.org/2.0/docs/tools/polymer-json#fragments) (Optional): A list of other entrypoints into your application.
  - `root` (Defaults to current working directory): The web root of your application, can be a subfolder of your project directory.
  - `sources` (Defaults to `src/**/*`): The source files in your application.

Configuration can be passed to all commands via global CLI flags: `--entrypoint`, `--shell`, etc. However we recommend saving your configuration to a `polymer.json` configuration file in your project. This guarantees a single shared configuration that will be read automatically for every command. Other project settings, like build and lint rules, can also be defined here.

Read the [polymer.json spec](https://www.polymer-project.org/2.0/docs/tools/polymer-json) for a full list of all supported fields with examples.


## Command Overview

### `polymer help [COMMAND]`

Run `polymer help` to get a helpful list of supported commands. Pass it a command name (ex: `polymer help serve`) to get detailed information about that command and the options it supports.


### `polymer init [TEMPLATE]`

Initializes a Polymer project from one of several templates. Pre-bundled templates range from just bare-bones to fully featured applications like the [Polymer Starter Kit](https://github.com/PolymerElements/polymer-starter-kit).

You can download and run templates built by our community as well. [Search npm](https://www.npmjs.com/search?q=generator-polymer-init) for a template you'd like to use. Then install it and the CLI will pick it up automatically.

Run `polymer init` to choose a template from a list of all installed templates. Or, if you know the template name before hand, you can provide it as a command argument to select it automatically.


### `polymer install [--variants]`

Install your dependencies, similar to running `bower install`.

If the `--variants` option is provided, the command will also search your project's `bower.json` for a `"variants"` property and install any dependency variants listed there. [Dependency variants](https://www.polymer-project.org/2.0/docs/glossary#dependency-variants) describe alternative sets of dependencies to install alongside your normal `bower_components/` folder. Other CLI commands like `polymer test` and `polymer serve` are able to read these alternative dependency sets and test/serve them in parallel. This is especially useful if you need to test your elements against multiple versions of Polymer and/or other dependencies.


### `polymer serve [options...]`

Start a development server designed for serving Polymer & Web Component projects. Applications are served as-is, while elements are served from a special route where it can properly reference its dependencies.

By default, the server will automatically use [Babel](https://babeljs.io) to transpile any ES6 code down to ES5 for browsers that don't have native support for important ES6 features like classes. This behavior can be explicitly turned on/off for all browsers via the `--compile` option.

Run `polymer help serve` for the full list of available options.


### `polymer lint [--rules RULE_SET] [options...]`

Lint your project for common errors. Specify a set of linting rules via the `--rules` command option or your `polymer.json` configuration. To make sure you always use the correct rule set, we recommend adding a "lint" section to your polymer.json like so:

```json
"lint": {
  "rules": [
    "polymer-2-hybrid"
  ]
},
```

Run `polymer help lint` for the full list of available options and rule sets.


### `polymer test [options...]`

Run your element or application tests with [`web-component-tester`](https://github.com/Polymer/web-component-tester/).

Run `polymer help test` for the full list of available options.


### `polymer build [options...]`

Build a Polymer application for production. This includes support for optimizations like code bundling, minification, and ES6 compilation to run on older browsers.

Most optimizations are disabled by default. To make sure the correct build enhancements are always used, you can provide a set of build configurations via the ["builds"](https://www.polymer-project.org/2.0/docs/tools/polymer-json#builds) field of your `polymer.json` file:

```json
"builds": [{
  "bundle": true,
  "js": {"minify": true},
  "css": {"minify": true},
  "html": {"minify": true}
}],
```

Run `polymer help build` for the full list of available options & optimizations.

If you need support for something that is missing from the CLI, check out the [polymer-build](https://github.com/Polymer/polymer-build) library. Is the JS library that powers the CLI, and calling it directly gives you much greater control than the CLI can provide. Visit the repo for usage information and examples.


### `polymer analyze [files...]`

Generates an analyzed JSON representation of your element or project. This can be useful if you are working with other tooling that requires a cached analysis of your project.

Run `polymer help analyze` for the full list of available options.


## Supported Node.js Versions

Polymer CLI supports the [current & active LTS versions](https://github.com/nodejs/LTS) of Node.js and later. See the [Polymer Tools Node.js Support Policy](https://www.polymer-project.org/2.0/docs/tools/node-support) for more information.

## Compiling from Source

You can compile and run the CLI from source by cloning the repo from Github and then running `npm run build`. But make sure you have already run `npm install` before building.

```bash
# clone the repo from github
yarn install
yarn run build
yarn link # link your local copy of the CLI to your terminal path
```


