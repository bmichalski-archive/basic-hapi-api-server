require('source-map-support').install({ handleUncaughtExceptions: false })

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var util = require('util');
var NestedError = require('nested-error-stacks');

function InitServerConfigurationError(message, nested) {
  NestedError.call(this, message, nested);
}

util.inherits(InitServerConfigurationError, NestedError);
InitServerConfigurationError.prototype.name = 'BasicHapiApiServerInitServerConfigurationError';

exports.default = InitServerConfigurationError;

//# sourceMappingURL=./configuration-error.js.map