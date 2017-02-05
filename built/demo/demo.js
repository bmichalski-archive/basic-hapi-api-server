require('source-map-support').install({ handleUncaughtExceptions: false })

'use strict';

var _initServer = require('../init-server');

var _initServer2 = _interopRequireDefault(_initServer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var port = process.env.DEMO_PORT === undefined ? 8080 : process.env.DEMO_PORT;
var usesAuthentication = process.env.DEMO_AUTHENTICATION === undefined ? false : 1 === parseInt(process.env.DEMO_AUTHENTICATION, 10);

var authenticationStrategies = void 0;

if (usesAuthentication) {
  authenticationStrategies = [{
    name: 'simple',
    validate: function validate(request, username, password, callback) {
      var isValid = username === 'hello' && password === 'world';

      return callback(null, isValid, { id: 42 });
    }
  }];
} else {
  authenticationStrategies = [];
}

var config = {
  api: {
    name: 'Demo server',
    version: '1',
    hasDocumentation: true,
    routes: [{
      method: 'GET',
      path: '/hello-world',
      handler: function handler(request, reply) {
        reply({
          hello: 'world'
        });
      },
      config: {
        description: 'Hello world'
      }
    }, {
      method: 'GET',
      path: '/hello-world-promise',
      handler: function handler(request, reply) {
        reply(new Promise(function (resolve) {
          return resolve({
            hello: 'world'
          });
        }));
      },
      config: {
        description: 'Hello world using promise'
      }
    }, {
      method: 'GET',
      path: '/internal-server-error',
      handler: function handler() {
        throw new Error('err');
      },
      config: {
        description: 'Internal server error'
      }
    }, {
      method: 'GET',
      path: '/internal-server-error-not-obj',
      handler: function handler() {
        throw 'err';
      },
      config: {
        description: 'Internal server error with non object'
      }
    }, {
      method: 'GET',
      path: '/promise-unhandled-rejection',
      handler: function handler(request, reply) {
        reply(new Promise(function () {
          throw new Error('err');
        }));
      },
      config: {
        description: 'Promise with unhandled rejection'
      }
    }, {
      method: 'GET',
      path: '/promise-unhandled-rejection-not-obj',
      handler: function handler(request, reply) {
        reply(new Promise(function () {
          throw 'err';
        }));
      },
      config: {
        description: 'Promise with unhandled rejection with non object'
      }
    }, {
      method: 'GET',
      path: '/timeout',
      handler: function handler() {
        //Do nothing and wait for timeout
      },
      config: {
        timeout: {
          server: 200
        },
        description: 'Timeout'
      }
    }],
    usesAuthentication: usesAuthentication,
    authenticationStrategies: authenticationStrategies
  },
  server: {
    connections: [{
      port: port
    }]
  }
};

if (usesAuthentication) {
  config.api.routes.push({
    method: 'GET',
    path: '/hello-world-protected',
    handler: function handler(request, reply) {
      reply({
        hello: 'world'
      });
    },
    config: {
      auth: 'simple',
      description: 'Hello world with authentication'
    }
  });
}

var exposedRoutes = [];

config.api.routes.forEach(function (route) {
  exposedRoutes.push({
    path: 'http://localhost:8080' + route.path,
    description: route.config.description
  });
});

config.api.routes.push({
  method: 'GET',
  path: '/',
  handler: function handler(request, reply) {
    reply(exposedRoutes);
  },
  config: {
    description: 'Exposed routes'
  }
});

(0, _initServer2.default)(config).then(function (server) {
  server.start(function () {
    console.log('Server started, listening on port ' + port + ' ' + (usesAuthentication ? 'with authentication' : ''));
  });
});

//# sourceMappingURL=./demo.js.map