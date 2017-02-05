require('source-map-support').install({ handleUncaughtExceptions: false })

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var util = require('util');
var NestedError = require('nested-error-stacks');

function InitServerPluginRegistrationError(message, nested) {
  NestedError.call(this, message, nested);
}

util.inherits(InitServerPluginRegistrationError, NestedError);
InitServerPluginRegistrationError.prototype.name = 'BasicHapiApiServerInitServerPluginRegistrationError';

exports.default = InitServerPluginRegistrationError;

//# sourceMappingURL=./plugin-registration-error.js.map