require('source-map-support').install({ handleUncaughtExceptions: false })

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var util = require('util');
var NestedError = require('nested-error-stacks');

function InitServerUncaughtError(message, nested) {
  NestedError.call(this, message, nested);
}

util.inherits(InitServerUncaughtError, NestedError);
InitServerUncaughtError.prototype.name = 'BasicHapiApiServerInitServerUncaughtError';

exports.default = InitServerUncaughtError;

//# sourceMappingURL=./uncaught-error.js.map