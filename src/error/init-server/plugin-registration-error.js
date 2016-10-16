const util = require('util')
const NestedError = require('nested-error-stacks')

function InitServerPluginRegistrationError(message, nested) {
  NestedError.call(this, message, nested);
}

util.inherits(InitServerPluginRegistrationError, NestedError);
InitServerPluginRegistrationError.prototype.name = 'BasicHapiApiServerInitServerPluginRegistrationError'

export default InitServerPluginRegistrationError