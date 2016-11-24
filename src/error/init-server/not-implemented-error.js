const util = require('util')
const NestedError = require('nested-error-stacks')

function InitServerNotImplementedError(message, nested) {
  NestedError.call(this, message, nested)
}

util.inherits(InitServerNotImplementedError, NestedError)
InitServerNotImplementedError.prototype.name = 'BasicHapiApiServerInitServerNotImplementedError'

export default InitServerNotImplementedError