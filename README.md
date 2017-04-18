# polymer-cli

[![Build Status](https://travis-ci.org/Polymer/polymer-cli.svg?branch=master)](https://travis-ci.org/Polymer/polymer-cli)
[![Build status](https://ci.appveyor.com/api/projects/status/3xc7rkapu39rw9fs/branch/master?svg=true)](https://ci.appveyor.com/project/justinfagnani/polymer-cli/branch/master)

The command-line tool for Polymer projects and Web Components.

## Features

  - **init** - Create a new Polymer project from pre-configured starter templates
  - **install** - Install bower dependencies as well as [dependency variants](https://www.polymer-project.org/2.0/docs/glossary#dependency-variants) for testing
  - **serve**	- Serve elements and applications locally
  - **lint** - Lint a project to catch errors before your users do
  - **test** - Test your project with [`web-component-tester`](https://github.com/Polymer/web-component-tester/)
  - **build**	- Build an application optimized for production
  - **analyze** - Generate an analyzed JSON representation of your element or application

> **For a detailed overview of the CLI, how it works and when to use it, check out the official
[Polymer CLI guide](https://www.polymer-project.org/2.0/docs/tools/polymer-cli).**
> This README will focus on the individual CLI commands and how to run them.


## Installation

```bash
$ npm install -g polymer-cli
# or...
$ yarn add global polymer-cli
```


## Configuration

An application can be configured for all commands via global flags: `--entrypoint`, `--shell`, etc.

We recommend saving your configuration to a `polymer.json` configuration file in your project so that they can be read automatically for every command. Other project settings, like build and lint rules, can also be defined here. Read the [polymer.json spec](https://www.polymer-project.org/2.0/docs/tools/polymer-json) for a full list of all supported configurations.

Below is an example of a simple `polymer.json` application configuration:

```json
{
  "entrypoint": "index.html",
  "shell": "src/my-app.html",
  "fragments": [
    "src/app-home.html",
    "src/app-view-1.html",
    "src/app-view-2.html",
    "src/app-view-3.html",
  ],
  "sources": [
    "src/**/*",
    "images/**/*",
    "bower.json"
  ],
  "includeDependencies": [
    "bower_components/additional-files-to-include-in-build/**/*",
    "bower_components/webcomponentsjs/webcomponents-lite.js"
  ]
}
```


## Command Overview

### `polymer help [COMMAND]`

Run `polymer help` to get a helpful list of supported commands. Pass it a command name (ex: `polymer help serve`) to get detailed information about that command and the options it supports.


### `polymer init [TEMPLATE]`

Initializes a Polymer project from one of several templates. Pre-bundled templates range from just bare-bones to fully featured applications like the [Polymer Starter Kit](https://github.com/PolymerElements/polymer-starter-kit).

You can download and run templates built by our community as well. [Search npm](https://www.npmjs.com/search?q=generator-polymer-init) for a template you'd like to use. Then install it and the CLI will pick it up automatically.

Run `polymer init` to choose a template from a list of all installed templates. Or if you know the template name before hand, you can provide it as a command argument.


### `polymer install [--variants]`

Install your dependencies, similar to running `bower install`.

If the `--variants` option is provided, the command will also search your project's `bower.json` for a `"variants"` property and install any [dependency variants](https://www.polymer-project.org/2.0/docs/glossary#dependency-variants) listed there as well as well. This is useful if you need to test your elements against multiple versions of Polymer and/or sets of dependencies.


### `polymer serve [options...]`

Start a development server designed for serving Polymer & Web Component projects. Applications are served as-is, while elements are served from a special route where it can properly reference its dependencies.

Run `polymer help serve` for the full list of available options.


### `polymer lint [--rules RULE_SET] [options...]`

Lint your project for common errors. Provide a set of linting rules via either your `polymer.json` configuration file or the `--rules` command option.

For example, if you wanted to lint a Polymer 2.0 Hybrid element, you would run `polymer lint --rules polymer-2-hybrid`. To make sure the correct rule set is always used, you should add the following field to your `polymer.json`:

```json
"lint": {
  "rules": [
    "polymer-2-hybrid"
  ]
},
```

Run `polymer help lint` for the full list of available options.


### `polymer test [options...]`

Run your element or application tests with [`web-component-tester`](https://github.com/Polymer/web-component-tester/).

Run `polymer help test` for the full list of available options.


### `polymer build [options...]`

Build a Polymer application for production. This includes support for site optimizations like code bundling, minification, and ES6 compilation to run on older browsers.

Most optimizations and production enhancements are disabled by default. To make sure the correct build enhancements are always used, you can provide a set of build configurations via the ["builds"](https://www.polymer-project.org/2.0/docs/tools/polymer-json#builds) field of your `polymer.json` file:

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


### `polymer analyze [options...]`

Generates an analyzed JSON representation of your element or project. This can be useful if you are working with other tooling that requires a cached analysis of your project.

Run `polymer help analyze` for the full list of available options.


## Supported Node.js Versions

Polymer CLI supports the [current & active LTS versions](https://github.com/nodejs/LTS) of Node.js and later. See the [Polymer Tools Node.js Support Policy](https://www.polymer-project.org/2.0/docs/tools/node-support) for more information.

## Compiling from Source

You can compile and run the CLI from source by cloning the repo from Github and then running `npm run build`. But make sure you have already run `npm install` before building.

```bash
# clone the repo from github
npm install
npm run build
npm link # link your local copy of the CLI to your terminal path
```


