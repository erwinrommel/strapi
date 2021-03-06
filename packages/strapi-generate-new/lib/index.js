'use strict';

/**
 * Module dependencies
 */

// Node.js core.
const path = require('path');

// Local dependencies.
const packageJSON = require('../json/package.json.js');

/**
 * Copy required files for the generated application
 */

module.exports = {
  moduleDir: path.resolve(__dirname, '..'),
  templatesDirectory: path.resolve(__dirname, '..', 'templates'),
  before: require('./before'),
  after: require('./after'),
  targets: {

    // Call the `admin` generator.
    '.': ['admin'],

    // Main package.
    'package.json': {
      jsonfile: packageJSON
    },

    // Copy dot files.
    '.editorconfig': {
      copy: 'editorconfig'
    },
    '.npmignore': {
      copy: 'npmignore'
    },

    // Copy Markdown files with some information.
    'README.md': {
      template: 'README.md'
    },

    // Empty API directory.
    'api': {
      folder: {}
    },

    // Empty plugins directory.
    'plugins': {
      folder: {}
    },

    // Empty public directory.
    'public': {
      folder: {}
    },

    // Empty node_modules directory.
    'node_modules': {
      folder: {}
    }
  }
};
