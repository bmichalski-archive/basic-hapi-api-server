require('source-map-support').install({ handleUncaughtExceptions: false })

'use strict';

process.on('unhandledRejection', function (reason) {
  throw reason;
});

//# sourceMappingURL=./init.js.map