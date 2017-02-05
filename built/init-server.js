require('source-map-support').install({ handleUncaughtExceptions: false })

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

require('./init');

var _hapi = require('hapi');

var _hapi2 = _interopRequireDefault(_hapi);

var _slugify = require('slugify');

var _slugify2 = _interopRequireDefault(_slugify);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

var _serializeError = require('serialize-error');

var _serializeError2 = _interopRequireDefault(_serializeError);

var _boom = require('boom');

var _boom2 = _interopRequireDefault(_boom);

var _configurationError = require('./error/init-server/configuration-error');

var _configurationError2 = _interopRequireDefault(_configurationError);

var _pluginRegistrationError = require('./error/init-server/plugin-registration-error');

var _pluginRegistrationError2 = _interopRequireDefault(_pluginRegistrationError);

var _uncaughtError = require('./error/init-server/uncaught-error');

var _uncaughtError2 = _interopRequireDefault(_uncaughtError);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logsSchema = _joi2.default.object().keys({
  console: _joi2.default.boolean().default(true)
}).default({
  console: true
});

var apiConfigurationSchema = _joi2.default.object({
  name: _joi2.default.string().required(),
  version: _joi2.default.string().required(),
  routes: _joi2.default.array().items(_joi2.default.object()),
  hasDocumentation: _joi2.default.boolean().default(false),
  usesAuthentication: _joi2.default.boolean().default(false),
  authenticationStrategies: _joi2.default.array().items(_joi2.default.object().keys({
    name: _joi2.default.string().required().min(1),
    validate: _joi2.default.func().required()
  })),
  globalTimeout: _joi2.default.number().integer().min(0).default(2000)
});

var configurationSchema = _joi2.default.object().keys({
  logs: logsSchema,
  api: apiConfigurationSchema.required(),
  server: _joi2.default.object().keys({
    connections: _joi2.default.array().min(1).required()
  }).required()
});

function initServer(rawConfiguration) {
  var configuration = void 0;

  _joi2.default.validate({ configuration: rawConfiguration }, { configuration: configurationSchema.required() }, function (err, value) {
    if (err) {
      throw new _configurationError2.default('', err);
    }

    configuration = value.configuration;
  });

  var logsConfiguration = configuration.logs;
  var apiConfiguration = configuration.api;
  var globalTimeout = configuration.api.globalTimeout;
  var connections = configuration.server.connections;
  var plugins = [];
  var transports = [];

  if (logsConfiguration.console) {
    transports.push(new _winston2.default.transports.Console({
      json: true
    }));
  }

  var logger = new _winston2.default.Logger({
    transports: transports
  });

  var server = new _hapi2.default.Server();

  connections.forEach(function (connection) {
    server.connection(connection);
  });

  if (apiConfiguration.hasDocumentation) {
    var hapiSwaggerConfiguration = {
      info: {
        title: apiConfiguration.name + ' documentation',
        version: apiConfiguration.version
      }
    };

    plugins.push(require('inert'));
    plugins.push(require('vision'));
    plugins.push({
      register: require('hapi-swagger'),
      options: hapiSwaggerConfiguration
    });
  }

  if (apiConfiguration.usesAuthentication) {
    plugins.push(require('hapi-auth-basic'));
  }

  server.ext('onPreResponse', function (request, reply) {
    var response = request.response;

    if (undefined !== response.request && response.request.path.indexOf('/api') !== 0) {
      return reply.continue();
    }

    if (response.isBoom) {
      if (500 === response.output.statusCode) {
        logger.log('error', 'Uncaught internal server error', { error: (0, _serializeError2.default)(response) });
      } else if (503 === response.output.statusCode) {
        logger.log('error', 'Service unavailable', { error: (0, _serializeError2.default)(response) });
      }

      return reply({
        status: (0, _slugify2.default)(response.output.payload.error, '_').toLowerCase()
      }).code(response.output.statusCode);
    } else {
      var statusCode = response.statusCode;

      if (200 === statusCode) {
        var source = void 0;

        if (null === response.source) {
          source = { status: 'success' };
        } else {
          source = _lodash2.default.extend({ status: 'success' }, response.source);
        }

        return reply(source);
      }
    }

    throw new Error('Unhandled response.');
  });

  return new Promise(function (resolve) {
    server.register(plugins, function (err) {
      if (err) {
        throw new _pluginRegistrationError2.default('', err);
      }

      if (apiConfiguration.usesAuthentication) {
        apiConfiguration.authenticationStrategies.forEach(function (authenticationStrategy) {
          server.auth.strategy(authenticationStrategy.name, 'basic', { validateFunc: authenticationStrategy.validate });
        });
      }

      var routes = apiConfiguration.routes;

      if (undefined !== routes) {
        routes.forEach(function (route) {
          if (undefined === route.config) {
            route.config = {};
          }

          if (undefined === route.config.timeout) {
            route.config.timeout = {};
          }

          if (undefined === route.config.timeout.server) {
            route.config.timeout.server = globalTimeout;
          }

          if (undefined === route.config.tags) {
            route.config.tags = [];
          }

          if (route.config.tags.indexOf('api') === -1) {
            route.config.tags.push('api');
          }

          /**
           * Works around a bug.
           * To reproduce this bug:
           * * throw an exception in a handler
           * * next try another request: it hangs
           * * abort
           * * try another request: this one does not hang
           *
           * I could not reproduce easily reproduce this with tests.
           *
           * TODO Reproduce this in tests
           */
          var initHandler = route.handler;

          route.handler = function (request, reply) {
            try {
              return initHandler(request, reply);
            } catch (err) {
              var causedBy = void 0;

              if (err instanceof Error) {
                causedBy = err;
              } else {
                causedBy = new Error(JSON.stringify({ 'isNotError': true, err: err }));
              }

              return reply(_boom2.default.wrap(new _uncaughtError2.default('', causedBy)));
            }
          };
          /** End of workaround */

          server.route(route);
        });
      }

      resolve(server);
    });
  });
}

exports.default = initServer;

//# sourceMappingURL=./init-server.js.map