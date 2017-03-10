'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const _ = require('lodash');

// Strapi services actions.
const deploySignupAction = require('../actions/deploySignup');

// Utils.
const listInput = require('../utils/input/list');
const cmd = require('../utils/cmd');

// Logger.
const error = require('../utils/output/error');
const wait = require('../utils/output/wait');

module.exports = async (token) => {
  const HOME = process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'];

  const resSshList = await cmd(`ls ${HOME}/.ssh`);

  const keys = _.filter(_.dropRight(resSshList.split('\n')), value => {
    return _.endsWith(value, '.pub');
  });

  const choices = _.map(keys, value => {
    return {
      name: _.trimEnd(value, '.pub'),
      value: value,
      short: _.trimEnd(value, '.pub')
    };
  });

  const choice = await listInput({
    message: 'Chose ssh-key',
    choices,
    separator: false,
    abort: 'end'
  });

  if (choice === 'abort') {
    process.exit(1);
  }

  const key = await cmd(`cat ${HOME}/.ssh/${choice}`);

  const loader = wait('Set up your deploy account...');

  const res = await deploySignupAction(token, {
    ssh: key
  });

  loader();

  if (res.error) {
    error(res.error);
    process.exit(1);
  }
};