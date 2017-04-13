# \<<%= name %>\>

<%= description %>

## Install the Polymer-CLI

First, make sure you have the [Polymer CLI](https://www.npmjs.com/package/polymer-cli) installed. Then run `polymer serve` to serve your application locally.

## Viewing Your Application

```
$ polymer serve
```

## Building Your Application

```
$ polymer build
```

This will create a `build/` folder with `default/` and `bower_components/` sub-folders
containing a unbundled build, run through HTML, CSS, and JS optimizers. New build options have been added to give you more control over the generated build. These options can be defined in your project's `polymer.json`, or via CLI flags. Run `polymer build --help` to see a list of new supported CLI flags.

You can serve the built versions by giving `polymer serve` a folder to serve
from:

```
$ polymer serve build/bundled
```

## Running Tests

```
$ polymer test
```

Your application is already set up to be tested via [web-component-tester](https://github.com/Polymer/web-component-tester). Run `polymer test` to run your application's test suite locally.
