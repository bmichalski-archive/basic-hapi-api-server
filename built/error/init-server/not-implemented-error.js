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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVycm9yL2luaXQtc2VydmVyL25vdC1pbXBsZW1lbnRlZC1lcnJvci5qcyJdLCJuYW1lcyI6WyJ1dGlsIiwicmVxdWlyZSIsIk5lc3RlZEVycm9yIiwiSW5pdFNlcnZlck5vdEltcGxlbWVudGVkRXJyb3IiLCJtZXNzYWdlIiwibmVzdGVkIiwiY2FsbCIsImluaGVyaXRzIiwicHJvdG90eXBlIiwibmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxJQUFNQSxPQUFPQyxRQUFRLE1BQVIsQ0FBYjtBQUNBLElBQU1DLGNBQWNELFFBQVEscUJBQVIsQ0FBcEI7O0FBRUEsU0FBU0UsNkJBQVQsQ0FBdUNDLE9BQXZDLEVBQWdEQyxNQUFoRCxFQUF3RDtBQUN0REgsY0FBWUksSUFBWixDQUFpQixJQUFqQixFQUF1QkYsT0FBdkIsRUFBZ0NDLE1BQWhDO0FBQ0Q7O0FBRURMLEtBQUtPLFFBQUwsQ0FBY0osNkJBQWQsRUFBNkNELFdBQTdDO0FBQ0FDLDhCQUE4QkssU0FBOUIsQ0FBd0NDLElBQXhDLEdBQStDLGlEQUEvQzs7a0JBRWVOLDZCIiwiZmlsZSI6ImVycm9yL2luaXQtc2VydmVyL25vdC1pbXBsZW1lbnRlZC1lcnJvci5qcyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHV0aWwgPSByZXF1aXJlKCd1dGlsJylcbmNvbnN0IE5lc3RlZEVycm9yID0gcmVxdWlyZSgnbmVzdGVkLWVycm9yLXN0YWNrcycpXG5cbmZ1bmN0aW9uIEluaXRTZXJ2ZXJOb3RJbXBsZW1lbnRlZEVycm9yKG1lc3NhZ2UsIG5lc3RlZCkge1xuICBOZXN0ZWRFcnJvci5jYWxsKHRoaXMsIG1lc3NhZ2UsIG5lc3RlZClcbn1cblxudXRpbC5pbmhlcml0cyhJbml0U2VydmVyTm90SW1wbGVtZW50ZWRFcnJvciwgTmVzdGVkRXJyb3IpXG5Jbml0U2VydmVyTm90SW1wbGVtZW50ZWRFcnJvci5wcm90b3R5cGUubmFtZSA9ICdCYXNpY0hhcGlBcGlTZXJ2ZXJJbml0U2VydmVyTm90SW1wbGVtZW50ZWRFcnJvcidcblxuZXhwb3J0IGRlZmF1bHQgSW5pdFNlcnZlck5vdEltcGxlbWVudGVkRXJyb3IiXX0=