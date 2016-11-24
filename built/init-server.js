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
    transports.push(new _winston2.default.transports.Console());
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

          var initHandler = route.handler;

          /**
           * Works around a bug.
           * To reproduce this bug:
           * * throw an exception in a handler
           * * next try another request: it hangs
           * * abort
           * * try another request: this one does not hang
           */
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

          server.route(route);
        });
      }

      resolve(server);
    });
  });
}

exports.default = initServer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluaXQtc2VydmVyLmpzIl0sIm5hbWVzIjpbImxvZ3NTY2hlbWEiLCJvYmplY3QiLCJrZXlzIiwiY29uc29sZSIsImJvb2xlYW4iLCJkZWZhdWx0IiwiYXBpQ29uZmlndXJhdGlvblNjaGVtYSIsIm5hbWUiLCJzdHJpbmciLCJyZXF1aXJlZCIsInZlcnNpb24iLCJyb3V0ZXMiLCJhcnJheSIsIml0ZW1zIiwiaGFzRG9jdW1lbnRhdGlvbiIsInVzZXNBdXRoZW50aWNhdGlvbiIsImF1dGhlbnRpY2F0aW9uU3RyYXRlZ2llcyIsIm1pbiIsInZhbGlkYXRlIiwiZnVuYyIsImdsb2JhbFRpbWVvdXQiLCJudW1iZXIiLCJpbnRlZ2VyIiwiY29uZmlndXJhdGlvblNjaGVtYSIsImxvZ3MiLCJhcGkiLCJzZXJ2ZXIiLCJjb25uZWN0aW9ucyIsImluaXRTZXJ2ZXIiLCJyYXdDb25maWd1cmF0aW9uIiwiY29uZmlndXJhdGlvbiIsImVyciIsInZhbHVlIiwibG9nc0NvbmZpZ3VyYXRpb24iLCJhcGlDb25maWd1cmF0aW9uIiwicGx1Z2lucyIsInRyYW5zcG9ydHMiLCJwdXNoIiwiQ29uc29sZSIsImxvZ2dlciIsIkxvZ2dlciIsIlNlcnZlciIsImZvckVhY2giLCJjb25uZWN0aW9uIiwiaGFwaVN3YWdnZXJDb25maWd1cmF0aW9uIiwiaW5mbyIsInRpdGxlIiwicmVxdWlyZSIsInJlZ2lzdGVyIiwib3B0aW9ucyIsImV4dCIsInJlcXVlc3QiLCJyZXBseSIsInJlc3BvbnNlIiwidW5kZWZpbmVkIiwicGF0aCIsImluZGV4T2YiLCJjb250aW51ZSIsImlzQm9vbSIsIm91dHB1dCIsInN0YXR1c0NvZGUiLCJsb2ciLCJlcnJvciIsInN0YXR1cyIsInBheWxvYWQiLCJ0b0xvd2VyQ2FzZSIsImNvZGUiLCJzb3VyY2UiLCJleHRlbmQiLCJFcnJvciIsIlByb21pc2UiLCJyZXNvbHZlIiwiYXV0aGVudGljYXRpb25TdHJhdGVneSIsImF1dGgiLCJzdHJhdGVneSIsInZhbGlkYXRlRnVuYyIsInJvdXRlIiwiY29uZmlnIiwidGltZW91dCIsInRhZ3MiLCJpbml0SGFuZGxlciIsImhhbmRsZXIiLCJjYXVzZWRCeSIsIkpTT04iLCJzdHJpbmdpZnkiLCJ3cmFwIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBRUEsSUFBTUEsYUFBYSxjQUFJQyxNQUFKLEdBQWFDLElBQWIsQ0FBa0I7QUFDbkNDLFdBQVMsY0FBSUMsT0FBSixHQUFjQyxPQUFkLENBQXNCLElBQXRCO0FBRDBCLENBQWxCLEVBRWhCQSxPQUZnQixDQUVSO0FBQ1RGLFdBQVM7QUFEQSxDQUZRLENBQW5COztBQU1BLElBQU1HLHlCQUF5QixjQUFJTCxNQUFKLENBQVc7QUFDeENNLFFBQU0sY0FBSUMsTUFBSixHQUFhQyxRQUFiLEVBRGtDO0FBRXhDQyxXQUFTLGNBQUlGLE1BQUosR0FBYUMsUUFBYixFQUYrQjtBQUd4Q0UsVUFBUSxjQUFJQyxLQUFKLEdBQVlDLEtBQVosQ0FBa0IsY0FBSVosTUFBSixFQUFsQixDQUhnQztBQUl4Q2Esb0JBQWtCLGNBQUlWLE9BQUosR0FBY0MsT0FBZCxDQUFzQixLQUF0QixDQUpzQjtBQUt4Q1Usc0JBQW9CLGNBQUlYLE9BQUosR0FBY0MsT0FBZCxDQUFzQixLQUF0QixDQUxvQjtBQU14Q1csNEJBQTBCLGNBQUlKLEtBQUosR0FBWUMsS0FBWixDQUFrQixjQUFJWixNQUFKLEdBQWFDLElBQWIsQ0FBa0I7QUFDNURLLFVBQU0sY0FBSUMsTUFBSixHQUFhQyxRQUFiLEdBQXdCUSxHQUF4QixDQUE0QixDQUE1QixDQURzRDtBQUU1REMsY0FBVSxjQUFJQyxJQUFKLEdBQVdWLFFBQVg7QUFGa0QsR0FBbEIsQ0FBbEIsQ0FOYztBQVV4Q1csaUJBQWUsY0FBSUMsTUFBSixHQUFhQyxPQUFiLEdBQXVCTCxHQUF2QixDQUEyQixDQUEzQixFQUE4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WixFQUFxQkMsS0FBckIsQ0FBUDtBQUNELGFBRkQsQ0FFRSxPQUFPckIsR0FBUCxFQUFZO0FBQ1osa0JBQUltRCxpQkFBSjs7QUFFQSxrQkFBSW5ELGVBQWVzQyxLQUFuQixFQUEwQjtBQUN4QmEsMkJBQVduRCxHQUFYO0FBQ0QsZUFGRCxNQUVPO0FBQ0xtRCwyQkFBVyxJQUFJYixLQUFKLENBQVVjLEtBQUtDLFNBQUwsQ0FBZSxFQUFFLGNBQWMsSUFBaEIsRUFBc0JyRCxLQUFLQSxHQUEzQixFQUFmLENBQVYsQ0FBWDtBQUNEOztBQUVELHFCQUFPcUIsTUFDTCxlQUFLaUMsSUFBTCxDQUNFLDRCQUFrQixFQUFsQixFQUFzQkgsUUFBdEIsQ0FERixDQURLLENBQVA7QUFLRDtBQUNGLFdBbEJEOztBQW9CQXhELGlCQUFPa0QsS0FBUCxDQUFhQSxLQUFiO0FBQ0QsU0FwREQ7QUFxREQ7O0FBRURMLGNBQVE3QyxNQUFSO0FBQ0QsS0F4RUg7QUEwRUQsR0EzRU0sQ0FBUDtBQTRFRDs7a0JBRWNFLFUiLCJmaWxlIjoiaW5pdC1zZXJ2ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJy4vaW5pdCdcbmltcG9ydCBIYXBpIGZyb20gJ2hhcGknXG5pbXBvcnQgc2x1Z2lmeSBmcm9tICdzbHVnaWZ5J1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJ1xuaW1wb3J0IEpvaSBmcm9tICdqb2knXG5pbXBvcnQgd2luc3RvbiBmcm9tICd3aW5zdG9uJ1xuaW1wb3J0IHNlcmlhbGl6ZUVycm9yIGZyb20gJ3NlcmlhbGl6ZS1lcnJvcidcbmltcG9ydCBCb29tIGZyb20gJ2Jvb20nXG5pbXBvcnQgQ29uZmlndXJhdGlvbkVycm9yIGZyb20gJy4vZXJyb3IvaW5pdC1zZXJ2ZXIvY29uZmlndXJhdGlvbi1lcnJvcidcbmltcG9ydCBQbHVnaW5SZWdpc3RyYXRpb25FcnJvciBmcm9tICcuL2Vycm9yL2luaXQtc2VydmVyL3BsdWdpbi1yZWdpc3RyYXRpb24tZXJyb3InXG5pbXBvcnQgVW5jYXVnaHRFcnJvciBmcm9tICcuL2Vycm9yL2luaXQtc2VydmVyL3VuY2F1Z2h0LWVycm9yJ1xuXG5jb25zdCBsb2dzU2NoZW1hID0gSm9pLm9iamVjdCgpLmtleXMoe1xuICBjb25zb2xlOiBKb2kuYm9vbGVhbigpLmRlZmF1bHQodHJ1ZSlcbn0pLmRlZmF1bHQoe1xuICBjb25zb2xlOiB0cnVlXG59KVxuXG5jb25zdCBhcGlDb25maWd1cmF0aW9uU2NoZW1hID0gSm9pLm9iamVjdCh7XG4gIG5hbWU6IEpvaS5zdHJpbmcoKS5yZXF1aXJlZCgpLFxuICB2ZXJzaW9uOiBKb2kuc3RyaW5nKCkucmVxdWlyZWQoKSxcbiAgcm91dGVzOiBKb2kuYXJyYXkoKS5pdGVtcyhKb2kub2JqZWN0KCkpLFxuICBoYXNEb2N1bWVudGF0aW9uOiBKb2kuYm9vbGVhbigpLmRlZmF1bHQoZmFsc2UpLFxuICB1c2VzQXV0aGVudGljYXRpb246IEpvaS5ib29sZWFuKCkuZGVmYXVsdChmYWxzZSksXG4gIGF1dGhlbnRpY2F0aW9uU3RyYXRlZ2llczogSm9pLmFycmF5KCkuaXRlbXMoSm9pLm9iamVjdCgpLmtleXMoe1xuICAgIG5hbWU6IEpvaS5zdHJpbmcoKS5yZXF1aXJlZCgpLm1pbigxKSxcbiAgICB2YWxpZGF0ZTogSm9pLmZ1bmMoKS5yZXF1aXJlZCgpXG4gIH0pKSxcbiAgZ2xvYmFsVGltZW91dDogSm9pLm51bWJlcigpLmludGVnZXIoKS5taW4oMCkuZGVmYXVsdCgyMDAwKVxufSlcblxuY29uc3QgY29uZmlndXJhdGlvblNjaGVtYSA9IEpvaS5vYmplY3QoKS5rZXlzKHtcbiAgbG9nczogbG9nc1NjaGVtYSxcbiAgYXBpOiBhcGlDb25maWd1cmF0aW9uU2NoZW1hLnJlcXVpcmVkKCksXG4gIHNlcnZlcjogSm9pLm9iamVjdCgpLmtleXMoe1xuICAgIGNvbm5lY3Rpb25zOiBKb2lcbiAgICAgIC5hcnJheSgpXG4gICAgICAubWluKDEpXG4gICAgICAucmVxdWlyZWQoKVxuICB9KS5yZXF1aXJlZCgpXG59KVxuXG5mdW5jdGlvbiBpbml0U2VydmVyKHJhd0NvbmZpZ3VyYXRpb24pIHtcbiAgbGV0IGNvbmZpZ3VyYXRpb25cblxuICBKb2kudmFsaWRhdGUoXG4gICAgeyBjb25maWd1cmF0aW9uOiByYXdDb25maWd1cmF0aW9uIH0sXG4gICAgeyBjb25maWd1cmF0aW9uOiBjb25maWd1cmF0aW9uU2NoZW1hLnJlcXVpcmVkKCkgfSxcbiAgICAoZXJyLCB2YWx1ZSkgPT4ge1xuICAgICAgaWYgKGVycikge1xuICAgICAgICB0aHJvdyBuZXcgQ29uZmlndXJhdGlvbkVycm9yKCcnLCBlcnIpXG4gICAgICB9XG5cbiAgICAgIGNvbmZpZ3VyYXRpb24gPSB2YWx1ZS5jb25maWd1cmF0aW9uXG4gICAgfVxuICApXG5cbiAgY29uc3QgbG9nc0NvbmZpZ3VyYXRpb24gPSBjb25maWd1cmF0aW9uLmxvZ3NcbiAgY29uc3QgYXBpQ29uZmlndXJhdGlvbiA9IGNvbmZpZ3VyYXRpb24uYXBpXG4gIGNvbnN0IGdsb2JhbFRpbWVvdXQgPSBjb25maWd1cmF0aW9uLmFwaS5nbG9iYWxUaW1lb3V0XG4gIGNvbnN0IGNvbm5lY3Rpb25zID0gY29uZmlndXJhdGlvbi5zZXJ2ZXIuY29ubmVjdGlvbnNcbiAgY29uc3QgcGx1Z2lucyA9IFtdXG4gIGNvbnN0IHRyYW5zcG9ydHMgPSBbXVxuXG4gIGlmIChsb2dzQ29uZmlndXJhdGlvbi5jb25zb2xlKSB7XG4gICAgdHJhbnNwb3J0cy5wdXNoKG5ldyAod2luc3Rvbi50cmFuc3BvcnRzLkNvbnNvbGUpKCkpXG4gIH1cblxuICBjb25zdCBsb2dnZXIgPSBuZXcgKHdpbnN0b24uTG9nZ2VyKSh7XG4gICAgdHJhbnNwb3J0c1xuICB9KVxuXG4gIGNvbnN0IHNlcnZlciA9IG5ldyBIYXBpLlNlcnZlcigpXG5cbiAgY29ubmVjdGlvbnMuZm9yRWFjaCgoY29ubmVjdGlvbikgPT4ge1xuICAgIHNlcnZlci5jb25uZWN0aW9uKGNvbm5lY3Rpb24pXG4gIH0pXG5cbiAgaWYgKGFwaUNvbmZpZ3VyYXRpb24uaGFzRG9jdW1lbnRhdGlvbikge1xuICAgIGNvbnN0IGhhcGlTd2FnZ2VyQ29uZmlndXJhdGlvbiA9IHtcbiAgICAgIGluZm86IHtcbiAgICAgICAgdGl0bGU6IGFwaUNvbmZpZ3VyYXRpb24ubmFtZSArICcgZG9jdW1lbnRhdGlvbicsXG4gICAgICAgIHZlcnNpb246IGFwaUNvbmZpZ3VyYXRpb24udmVyc2lvbixcbiAgICAgIH1cbiAgICB9XG5cbiAgICBwbHVnaW5zLnB1c2gocmVxdWlyZSgnaW5lcnQnKSlcbiAgICBwbHVnaW5zLnB1c2gocmVxdWlyZSgndmlzaW9uJykpXG4gICAgcGx1Z2lucy5wdXNoKFxuICAgICAge1xuICAgICAgICByZWdpc3RlcjogcmVxdWlyZSgnaGFwaS1zd2FnZ2VyJyksXG4gICAgICAgIG9wdGlvbnM6IGhhcGlTd2FnZ2VyQ29uZmlndXJhdGlvblxuICAgICAgfVxuICAgIClcbiAgfVxuXG4gIGlmIChhcGlDb25maWd1cmF0aW9uLnVzZXNBdXRoZW50aWNhdGlvbikge1xuICAgIHBsdWdpbnMucHVzaChyZXF1aXJlKCdoYXBpLWF1dGgtYmFzaWMnKSlcbiAgfVxuXG4gIHNlcnZlci5leHQoJ29uUHJlUmVzcG9uc2UnLCBmdW5jdGlvbiAocmVxdWVzdCwgcmVwbHkpIHtcbiAgICBjb25zdCByZXNwb25zZSA9IHJlcXVlc3QucmVzcG9uc2VcblxuICAgIGlmICh1bmRlZmluZWQgIT09IHJlc3BvbnNlLnJlcXVlc3QgJiYgcmVzcG9uc2UucmVxdWVzdC5wYXRoLmluZGV4T2YoJy9hcGknKSAhPT0gMCkge1xuICAgICAgcmV0dXJuIHJlcGx5LmNvbnRpbnVlKClcbiAgICB9XG5cbiAgICBpZiAocmVzcG9uc2UuaXNCb29tKSB7XG4gICAgICBpZiAoNTAwID09PSByZXNwb25zZS5vdXRwdXQuc3RhdHVzQ29kZSkge1xuICAgICAgICBsb2dnZXIubG9nKFxuICAgICAgICAgICdlcnJvcicsXG4gICAgICAgICAgJ1VuY2F1Z2h0IGludGVybmFsIHNlcnZlciBlcnJvcicsXG4gICAgICAgICAgeyBlcnJvcjogc2VyaWFsaXplRXJyb3IocmVzcG9uc2UpIH1cbiAgICAgICAgKVxuICAgICAgfSBlbHNlIGlmICg1MDMgPT09IHJlc3BvbnNlLm91dHB1dC5zdGF0dXNDb2RlKSB7XG4gICAgICAgIGxvZ2dlci5sb2coXG4gICAgICAgICAgJ2Vycm9yJyxcbiAgICAgICAgICAnU2VydmljZSB1bmF2YWlsYWJsZScsXG4gICAgICAgICAgeyBlcnJvcjogc2VyaWFsaXplRXJyb3IocmVzcG9uc2UpIH1cbiAgICAgICAgKVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVwbHkoXG4gICAgICAgIHtcbiAgICAgICAgICBzdGF0dXM6IHNsdWdpZnkocmVzcG9uc2Uub3V0cHV0LnBheWxvYWQuZXJyb3IsICdfJykudG9Mb3dlckNhc2UoKVxuICAgICAgICB9XG4gICAgICApXG4gICAgICAgIC5jb2RlKHJlc3BvbnNlLm91dHB1dC5zdGF0dXNDb2RlKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBzdGF0dXNDb2RlID0gcmVzcG9uc2Uuc3RhdHVzQ29kZVxuXG4gICAgICBpZiAoMjAwID09PSBzdGF0dXNDb2RlKSB7XG4gICAgICAgIGxldCBzb3VyY2VcblxuICAgICAgICBpZiAobnVsbCA9PT0gcmVzcG9uc2Uuc291cmNlKSB7XG4gICAgICAgICAgc291cmNlID0geyBzdGF0dXM6ICdzdWNjZXNzJyB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc291cmNlID0gXy5leHRlbmQoeyBzdGF0dXM6ICdzdWNjZXNzJyB9LCByZXNwb25zZS5zb3VyY2UpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVwbHkoc291cmNlKVxuICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IG5ldyBFcnJvcignVW5oYW5kbGVkIHJlc3BvbnNlLicpXG4gIH0pXG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgc2VydmVyLnJlZ2lzdGVyKFxuICAgICAgcGx1Z2lucyxcbiAgICAgIChlcnIpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHRocm93IG5ldyBQbHVnaW5SZWdpc3RyYXRpb25FcnJvcignJywgZXJyKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFwaUNvbmZpZ3VyYXRpb24udXNlc0F1dGhlbnRpY2F0aW9uKSB7XG4gICAgICAgICAgYXBpQ29uZmlndXJhdGlvbi5hdXRoZW50aWNhdGlvblN0cmF0ZWdpZXMuZm9yRWFjaChmdW5jdGlvbiAoYXV0aGVudGljYXRpb25TdHJhdGVneSkge1xuICAgICAgICAgICAgc2VydmVyLmF1dGguc3RyYXRlZ3koYXV0aGVudGljYXRpb25TdHJhdGVneS5uYW1lLCAnYmFzaWMnLCB7IHZhbGlkYXRlRnVuYzogYXV0aGVudGljYXRpb25TdHJhdGVneS52YWxpZGF0ZSB9KVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByb3V0ZXMgPSBhcGlDb25maWd1cmF0aW9uLnJvdXRlc1xuXG4gICAgICAgIGlmICh1bmRlZmluZWQgIT09IHJvdXRlcykge1xuICAgICAgICAgIHJvdXRlcy5mb3JFYWNoKChyb3V0ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHVuZGVmaW5lZCA9PT0gcm91dGUuY29uZmlnKSB7XG4gICAgICAgICAgICAgIHJvdXRlLmNvbmZpZyA9IHt9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh1bmRlZmluZWQgPT09IHJvdXRlLmNvbmZpZy50aW1lb3V0KSB7XG4gICAgICAgICAgICAgIHJvdXRlLmNvbmZpZy50aW1lb3V0ID0ge31cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHVuZGVmaW5lZCA9PT0gcm91dGUuY29uZmlnLnRpbWVvdXQuc2VydmVyKSB7XG4gICAgICAgICAgICAgIHJvdXRlLmNvbmZpZy50aW1lb3V0LnNlcnZlciA9IGdsb2JhbFRpbWVvdXRcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHVuZGVmaW5lZCA9PT0gcm91dGUuY29uZmlnLnRhZ3MpIHtcbiAgICAgICAgICAgICAgcm91dGUuY29uZmlnLnRhZ3MgPSBbXVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocm91dGUuY29uZmlnLnRhZ3MuaW5kZXhPZignYXBpJykgPT09IC0xKSB7XG4gICAgICAgICAgICAgIHJvdXRlLmNvbmZpZy50YWdzLnB1c2goJ2FwaScpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGluaXRIYW5kbGVyID0gcm91dGUuaGFuZGxlclxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFdvcmtzIGFyb3VuZCBhIGJ1Zy5cbiAgICAgICAgICAgICAqIFRvIHJlcHJvZHVjZSB0aGlzIGJ1ZzpcbiAgICAgICAgICAgICAqICogdGhyb3cgYW4gZXhjZXB0aW9uIGluIGEgaGFuZGxlclxuICAgICAgICAgICAgICogKiBuZXh0IHRyeSBhbm90aGVyIHJlcXVlc3Q6IGl0IGhhbmdzXG4gICAgICAgICAgICAgKiAqIGFib3J0XG4gICAgICAgICAgICAgKiAqIHRyeSBhbm90aGVyIHJlcXVlc3Q6IHRoaXMgb25lIGRvZXMgbm90IGhhbmdcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcm91dGUuaGFuZGxlciA9IChyZXF1ZXN0LCByZXBseSkgPT4ge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpbml0SGFuZGxlcihyZXF1ZXN0LCByZXBseSlcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgbGV0IGNhdXNlZEJ5XG5cbiAgICAgICAgICAgICAgICBpZiAoZXJyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgIGNhdXNlZEJ5ID0gZXJyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGNhdXNlZEJ5ID0gbmV3IEVycm9yKEpTT04uc3RyaW5naWZ5KHsgJ2lzTm90RXJyb3InOiB0cnVlLCBlcnI6IGVyciB9KSlcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVwbHkoXG4gICAgICAgICAgICAgICAgICBCb29tLndyYXAoXG4gICAgICAgICAgICAgICAgICAgIG5ldyBVbmNhdWdodEVycm9yKCcnLCBjYXVzZWRCeSlcbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VydmVyLnJvdXRlKHJvdXRlKVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICByZXNvbHZlKHNlcnZlcilcbiAgICAgIH1cbiAgICApXG4gIH0pXG59XG5cbmV4cG9ydCBkZWZhdWx0IGluaXRTZXJ2ZXIiXX0=