require('source-map-support').install({ handleUncaughtExceptions: false })

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var util = require('util');
var NestedError = require('nested-error-stacks');

function InitServerNotImplementedError(message, nested) {
  NestedError.call(this, message, nested);
}

util.inherits(InitServerNotImplementedError, NestedError);
InitServerNotImplementedError.prototype.name = 'BasicHapiApiServerInitServerNotImplementedError';

exports.default = InitServerNotImplementedError;

//# sourceMappingURL=./not-implemented-error.js.map