const util = require('util')
const NestedError = require('nested-error-stacks')

function InitServerConfigurationError(message, nested) {
  NestedError.call(this, message, nested)
}

util.inherits(InitServerConfigurationError, NestedError)
InitServerConfigurationError.prototype.name = 'BasicHapiApiServerInitServerConfigurationError'

export default InitServerConfigurationError