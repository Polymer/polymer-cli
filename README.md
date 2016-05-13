# polymer-cli

A command-line tool for Polymer projects

## Installation

Check your Node.js version. 

    $ node -v

Polymer CLI targets the LTS version (4.x) of Node.js. It should
work with the current version (6.x) but this is not officially
supported. Anything below the LTS version is not supported. 

    $ npm install -g polymer-cli

## Usage

### Display help:

    $ polymer help

### Initialize a project folder

    $ polymer init

### Lint a project

    $ polymer lint index.html

### Run web-component-tester tests

    $ polymer test

### Build a project

    $ polymer build --main index.html --shell src/my-app/my-app.html

### Start the development server

    $ polymer serve
