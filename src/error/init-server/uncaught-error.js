const util = require('util')
const NestedError = require('nested-error-stacks')

function InitServerUncaughtError(message, nested) {
  NestedError.call(this, message, nested);
}

util.inherits(InitServerUncaughtError, NestedError);
InitServerUncaughtError.prototype.name = 'BasicHapiApiServerInitServerUncaughtError'

export default InitServerUncaughtError