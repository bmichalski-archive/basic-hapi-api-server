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

var _notImplementedError = require('./error/init-server/not-implemented-error');

var _notImplementedError2 = _interopRequireDefault(_notImplementedError);

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
  globalTimeout: _joi2.default.number().integer().min(0).default(2000)
});

var configurationSchema = _joi2.default.object().keys({
  logs: logsSchema,
  api: apiConfigurationSchema.required(),
  server: _joi2.default.object().keys({
    connections: _joi2.default.array().min(1).items(_joi2.default.object().keys({
      port: _joi2.default.number().required().min(0).max(65535)
    })).required()
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
    //TODO
    throw new _notImplementedError2.default('Authentication feature is not yet implemented.');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluaXQtc2VydmVyLmpzIl0sIm5hbWVzIjpbImxvZ3NTY2hlbWEiLCJvYmplY3QiLCJrZXlzIiwiY29uc29sZSIsImJvb2xlYW4iLCJkZWZhdWx0IiwiYXBpQ29uZmlndXJhdGlvblNjaGVtYSIsIm5hbWUiLCJzdHJpbmciLCJyZXF1aXJlZCIsInZlcnNpb24iLCJyb3V0ZXMiLCJhcnJheSIsIml0ZW1zIiwiaGFzRG9jdW1lbnRhdGlvbiIsInVzZXNBdXRoZW50aWNhdGlvbiIsImdsb2JhbFRpbWVvdXQiLCJudW1iZXIiLCJpbnRlZ2VyIiwibWluIiwiY29uZmlndXJhdGlvblNjaGVtYSIsImxvZ3MiLCJhcGkiLCJzZXJ2ZXIiLCJjb25uZWN0aW9ucyIsInBvcnQiLCJtYXgiLCJpbml0U2VydmVyIiwicmF3Q29uZmlndXJhdGlvbiIsImNvbmZpZ3VyYXRpb24iLCJ2YWxpZGF0ZSIsImVyciIsInZhbHVlIiwibG9nc0NvbmZpZ3VyYXRpb24iLCJhcGlDb25maWd1cmF0aW9uIiwicGx1Z2lucyIsInRyYW5zcG9ydHMiLCJwdXNoIiwiQ29uc29sZSIsImxvZ2dlciIsIkxvZ2dlciIsIlNlcnZlciIsImZvckVhY2giLCJjb25uZWN0aW9uIiwiaGFwaVN3YWdnZXJDb25maWd1cmF0aW9uIiwiaW5mbyIsInRpdGxlIiwicmVxdWlyZSIsInJlZ2lzdGVyIiwib3B0aW9ucyIsImV4dCIsInJlcXVlc3QiLCJyZXBseSIsInJlc3BvbnNlIiwidW5kZWZpbmVkIiwicGF0aCIsImluZGV4T2YiLCJjb250aW51ZSIsImlzQm9vbSIsIm91dHB1dCIsInN0YXR1c0NvZGUiLCJsb2ciLCJlcnJvciIsInN0YXR1cyIsInBheWxvYWQiLCJ0b0xvd2VyQ2FzZSIsImNvZGUiLCJzb3VyY2UiLCJleHRlbmQiLCJFcnJvciIsIlByb21pc2UiLCJyZXNvbHZlIiwicm91dGUiLCJjb25maWciLCJ0aW1lb3V0IiwidGFncyIsImluaXRIYW5kbGVyIiwiaGFuZGxlciIsImNhdXNlZEJ5Iiwi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QXZELGlCQUFPaUQsS0FBUCxDQUFhQSxLQUFiO0FBQ0QsU0FwREQ7QUFxREQ7O0FBRURELGNBQVFoRCxNQUFSO0FBQ0QsS0FsRUg7QUFvRUQsR0FyRU0sQ0FBUDtBQXNFRDs7a0JBRWNJLFUiLCJmaWxlIjoiaW5pdC1zZXJ2ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJy4vaW5pdCdcbmltcG9ydCBIYXBpIGZyb20gJ2hhcGknXG5pbXBvcnQgc2x1Z2lmeSBmcm9tICdzbHVnaWZ5J1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJ1xuaW1wb3J0IEpvaSBmcm9tICdqb2knXG5pbXBvcnQgd2luc3RvbiBmcm9tICd3aW5zdG9uJ1xuaW1wb3J0IHNlcmlhbGl6ZUVycm9yIGZyb20gJ3NlcmlhbGl6ZS1lcnJvcidcbmltcG9ydCBCb29tIGZyb20gJ2Jvb20nXG5pbXBvcnQgQ29uZmlndXJhdGlvbkVycm9yIGZyb20gJy4vZXJyb3IvaW5pdC1zZXJ2ZXIvY29uZmlndXJhdGlvbi1lcnJvcidcbmltcG9ydCBQbHVnaW5SZWdpc3RyYXRpb25FcnJvciBmcm9tICcuL2Vycm9yL2luaXQtc2VydmVyL3BsdWdpbi1yZWdpc3RyYXRpb24tZXJyb3InXG5pbXBvcnQgTm90SW1wbGVtZW50ZWRFcnJvciBmcm9tICcuL2Vycm9yL2luaXQtc2VydmVyL25vdC1pbXBsZW1lbnRlZC1lcnJvcidcbmltcG9ydCBVbmNhdWdodEVycm9yIGZyb20gJy4vZXJyb3IvaW5pdC1zZXJ2ZXIvdW5jYXVnaHQtZXJyb3InXG5cbmNvbnN0IGxvZ3NTY2hlbWEgPSBKb2kub2JqZWN0KCkua2V5cyh7XG4gIGNvbnNvbGU6IEpvaS5ib29sZWFuKCkuZGVmYXVsdCh0cnVlKVxufSkuZGVmYXVsdCh7XG4gIGNvbnNvbGU6IHRydWVcbn0pXG5cbmNvbnN0IGFwaUNvbmZpZ3VyYXRpb25TY2hlbWEgPSBKb2kub2JqZWN0KHtcbiAgbmFtZTogSm9pLnN0cmluZygpLnJlcXVpcmVkKCksXG4gIHZlcnNpb246IEpvaS5zdHJpbmcoKS5yZXF1aXJlZCgpLFxuICByb3V0ZXM6IEpvaS5hcnJheSgpLml0ZW1zKEpvaS5vYmplY3QoKSksXG4gIGhhc0RvY3VtZW50YXRpb246IEpvaS5ib29sZWFuKCkuZGVmYXVsdChmYWxzZSksXG4gIHVzZXNBdXRoZW50aWNhdGlvbjogSm9pLmJvb2xlYW4oKS5kZWZhdWx0KGZhbHNlKSxcbiAgZ2xvYmFsVGltZW91dDogSm9pLm51bWJlcigpLmludGVnZXIoKS5taW4oMCkuZGVmYXVsdCgyMDAwKVxufSlcblxuY29uc3QgY29uZmlndXJhdGlvblNjaGVtYSA9IEpvaS5vYmplY3QoKS5rZXlzKHtcbiAgbG9nczogbG9nc1NjaGVtYSxcbiAgYXBpOiBhcGlDb25maWd1cmF0aW9uU2NoZW1hLnJlcXVpcmVkKCksXG4gIHNlcnZlcjogSm9pLm9iamVjdCgpLmtleXMoe1xuICAgIGNvbm5lY3Rpb25zOiBKb2lcbiAgICAgIC5hcnJheSgpXG4gICAgICAubWluKDEpXG4gICAgICAuaXRlbXMoXG4gICAgICAgIEpvaS5vYmplY3QoKS5rZXlzKHtcbiAgICAgICAgICBwb3J0OiBKb2kubnVtYmVyKCkucmVxdWlyZWQoKS5taW4oMCkubWF4KDY1NTM1KVxuICAgICAgICB9KVxuICAgICAgKVxuICAgICAgLnJlcXVpcmVkKClcbiAgfSkucmVxdWlyZWQoKVxufSlcblxuZnVuY3Rpb24gaW5pdFNlcnZlcihyYXdDb25maWd1cmF0aW9uKSB7XG4gIGxldCBjb25maWd1cmF0aW9uXG5cbiAgSm9pLnZhbGlkYXRlKFxuICAgIHsgY29uZmlndXJhdGlvbjogcmF3Q29uZmlndXJhdGlvbiB9LFxuICAgIHsgY29uZmlndXJhdGlvbjogY29uZmlndXJhdGlvblNjaGVtYS5yZXF1aXJlZCgpIH0sXG4gICAgKGVyciwgdmFsdWUpID0+IHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgdGhyb3cgbmV3IENvbmZpZ3VyYXRpb25FcnJvcignJywgZXJyKVxuICAgICAgfVxuXG4gICAgICBjb25maWd1cmF0aW9uID0gdmFsdWUuY29uZmlndXJhdGlvblxuICAgIH1cbiAgKVxuXG4gIGNvbnN0IGxvZ3NDb25maWd1cmF0aW9uID0gY29uZmlndXJhdGlvbi5sb2dzXG4gIGNvbnN0IGFwaUNvbmZpZ3VyYXRpb24gPSBjb25maWd1cmF0aW9uLmFwaVxuICBjb25zdCBnbG9iYWxUaW1lb3V0ID0gY29uZmlndXJhdGlvbi5hcGkuZ2xvYmFsVGltZW91dFxuICBjb25zdCBjb25uZWN0aW9ucyA9IGNvbmZpZ3VyYXRpb24uc2VydmVyLmNvbm5lY3Rpb25zXG4gIGNvbnN0IHBsdWdpbnMgPSBbXVxuICBjb25zdCB0cmFuc3BvcnRzID0gW11cblxuICBpZiAobG9nc0NvbmZpZ3VyYXRpb24uY29uc29sZSkge1xuICAgIHRyYW5zcG9ydHMucHVzaChuZXcgKHdpbnN0b24udHJhbnNwb3J0cy5Db25zb2xlKSgpKVxuICB9XG5cbiAgY29uc3QgbG9nZ2VyID0gbmV3ICh3aW5zdG9uLkxvZ2dlcikoe1xuICAgIHRyYW5zcG9ydHNcbiAgfSlcblxuICBjb25zdCBzZXJ2ZXIgPSBuZXcgSGFwaS5TZXJ2ZXIoKVxuXG4gIGNvbm5lY3Rpb25zLmZvckVhY2goKGNvbm5lY3Rpb24pID0+IHtcbiAgICBzZXJ2ZXIuY29ubmVjdGlvbihjb25uZWN0aW9uKVxuICB9KVxuXG4gIGlmIChhcGlDb25maWd1cmF0aW9uLmhhc0RvY3VtZW50YXRpb24pIHtcbiAgICBjb25zdCBoYXBpU3dhZ2dlckNvbmZpZ3VyYXRpb24gPSB7XG4gICAgICBpbmZvOiB7XG4gICAgICAgIHRpdGxlOiBhcGlDb25maWd1cmF0aW9uLm5hbWUgKyAnIGRvY3VtZW50YXRpb24nLFxuICAgICAgICB2ZXJzaW9uOiBhcGlDb25maWd1cmF0aW9uLnZlcnNpb24sXG4gICAgICB9XG4gICAgfVxuXG4gICAgcGx1Z2lucy5wdXNoKHJlcXVpcmUoJ2luZXJ0JykpXG4gICAgcGx1Z2lucy5wdXNoKHJlcXVpcmUoJ3Zpc2lvbicpKVxuICAgIHBsdWdpbnMucHVzaChcbiAgICAgIHtcbiAgICAgICAgcmVnaXN0ZXI6IHJlcXVpcmUoJ2hhcGktc3dhZ2dlcicpLFxuICAgICAgICBvcHRpb25zOiBoYXBpU3dhZ2dlckNvbmZpZ3VyYXRpb25cbiAgICAgIH1cbiAgICApXG4gIH1cblxuICBpZiAoYXBpQ29uZmlndXJhdGlvbi51c2VzQXV0aGVudGljYXRpb24pIHtcbiAgICAvL1RPRE9cbiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcignQXV0aGVudGljYXRpb24gZmVhdHVyZSBpcyBub3QgeWV0IGltcGxlbWVudGVkLicpXG4gIH1cblxuICBzZXJ2ZXIuZXh0KCdvblByZVJlc3BvbnNlJywgZnVuY3Rpb24gKHJlcXVlc3QsIHJlcGx5KSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSByZXF1ZXN0LnJlc3BvbnNlO1xuXG4gICAgaWYgKHVuZGVmaW5lZCAhPT0gcmVzcG9uc2UucmVxdWVzdCAmJiByZXNwb25zZS5yZXF1ZXN0LnBhdGguaW5kZXhPZignL2FwaScpICE9PSAwKSB7XG4gICAgICByZXR1cm4gcmVwbHkuY29udGludWUoKVxuICAgIH1cblxuICAgIGlmIChyZXNwb25zZS5pc0Jvb20pIHtcbiAgICAgIGlmICg1MDAgPT09IHJlc3BvbnNlLm91dHB1dC5zdGF0dXNDb2RlKSB7XG4gICAgICAgIGxvZ2dlci5sb2coXG4gICAgICAgICAgJ2Vycm9yJyxcbiAgICAgICAgICAnVW5jYXVnaHQgaW50ZXJuYWwgc2VydmVyIGVycm9yJyxcbiAgICAgICAgICB7IGVycm9yOiBzZXJpYWxpemVFcnJvcihyZXNwb25zZSkgfVxuICAgICAgICApXG4gICAgICB9IGVsc2UgaWYgKDUwMyA9PT0gcmVzcG9uc2Uub3V0cHV0LnN0YXR1c0NvZGUpIHtcbiAgICAgICAgbG9nZ2VyLmxvZyhcbiAgICAgICAgICAnZXJyb3InLFxuICAgICAgICAgICdTZXJ2aWNlIHVuYXZhaWxhYmxlJyxcbiAgICAgICAgICB7IGVycm9yOiBzZXJpYWxpemVFcnJvcihyZXNwb25zZSkgfVxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXBseShcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1czogc2x1Z2lmeShyZXNwb25zZS5vdXRwdXQucGF5bG9hZC5lcnJvciwgJ18nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIH1cbiAgICAgIClcbiAgICAgICAgLmNvZGUocmVzcG9uc2Uub3V0cHV0LnN0YXR1c0NvZGUpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHN0YXR1c0NvZGUgPSByZXNwb25zZS5zdGF0dXNDb2RlXG5cbiAgICAgIGlmICgyMDAgPT09IHN0YXR1c0NvZGUpIHtcbiAgICAgICAgbGV0IHNvdXJjZVxuXG4gICAgICAgIGlmIChudWxsID09PSByZXNwb25zZS5zb3VyY2UpIHtcbiAgICAgICAgICBzb3VyY2UgPSB7IHN0YXR1czogJ3N1Y2Nlc3MnIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzb3VyY2UgPSBfLmV4dGVuZCh7IHN0YXR1czogJ3N1Y2Nlc3MnIH0sIHJlc3BvbnNlLnNvdXJjZSlcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXBseShzb3VyY2UpXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbmhhbmRsZWQgcmVzcG9uc2UuJylcbiAgfSlcblxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICBzZXJ2ZXIucmVnaXN0ZXIoXG4gICAgICBwbHVnaW5zLFxuICAgICAgKGVycikgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFBsdWdpblJlZ2lzdHJhdGlvbkVycm9yKCcnLCBlcnIpXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByb3V0ZXMgPSBhcGlDb25maWd1cmF0aW9uLnJvdXRlc1xuXG4gICAgICAgIGlmICh1bmRlZmluZWQgIT09IHJvdXRlcykge1xuICAgICAgICAgIHJvdXRlcy5mb3JFYWNoKChyb3V0ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHVuZGVmaW5lZCA9PT0gcm91dGUuY29uZmlnKSB7XG4gICAgICAgICAgICAgIHJvdXRlLmNvbmZpZyA9IHt9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh1bmRlZmluZWQgPT09IHJvdXRlLmNvbmZpZy50aW1lb3V0KSB7XG4gICAgICAgICAgICAgIHJvdXRlLmNvbmZpZy50aW1lb3V0ID0ge31cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHVuZGVmaW5lZCA9PT0gcm91dGUuY29uZmlnLnRpbWVvdXQuc2VydmVyKSB7XG4gICAgICAgICAgICAgIHJvdXRlLmNvbmZpZy50aW1lb3V0LnNlcnZlciA9IGdsb2JhbFRpbWVvdXRcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHVuZGVmaW5lZCA9PT0gcm91dGUuY29uZmlnLnRhZ3MpIHtcbiAgICAgICAgICAgICAgcm91dGUuY29uZmlnLnRhZ3MgPSBbXVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocm91dGUuY29uZmlnLnRhZ3MuaW5kZXhPZignYXBpJykgPT09IC0xKSB7XG4gICAgICAgICAgICAgIHJvdXRlLmNvbmZpZy50YWdzLnB1c2goJ2FwaScpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGluaXRIYW5kbGVyID0gcm91dGUuaGFuZGxlclxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFdvcmtzIGFyb3VuZCBhIGJ1Zy5cbiAgICAgICAgICAgICAqIFRvIHJlcHJvZHVjZSB0aGlzIGJ1ZzpcbiAgICAgICAgICAgICAqICogdGhyb3cgYW4gZXhjZXB0aW9uIGluIGEgaGFuZGxlclxuICAgICAgICAgICAgICogKiBuZXh0IHRyeSBhbm90aGVyIHJlcXVlc3Q6IGl0IGhhbmdzXG4gICAgICAgICAgICAgKiAqIGFib3J0XG4gICAgICAgICAgICAgKiAqIHRyeSBhbm90aGVyIHJlcXVlc3Q6IHRoaXMgb25lIGRvZXMgbm90IGhhbmdcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcm91dGUuaGFuZGxlciA9IChyZXF1ZXN0LCByZXBseSkgPT4ge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpbml0SGFuZGxlcihyZXF1ZXN0LCByZXBseSlcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgbGV0IGNhdXNlZEJ5XG5cbiAgICAgICAgICAgICAgICBpZiAoZXJyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgIGNhdXNlZEJ5ID0gZXJyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGNhdXNlZEJ5ID0gbmV3IEVycm9yKEpTT04uc3RyaW5naWZ5KHsgJ2lzTm90RXJyb3InOiB0cnVlLCBlcnI6IGVyciB9KSlcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVwbHkoXG4gICAgICAgICAgICAgICAgICBCb29tLndyYXAoXG4gICAgICAgICAgICAgICAgICAgIG5ldyBVbmNhdWdodEVycm9yKCcnLCBjYXVzZWRCeSlcbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VydmVyLnJvdXRlKHJvdXRlKVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICByZXNvbHZlKHNlcnZlcilcbiAgICAgIH1cbiAgICApXG4gIH0pXG59XG5cbmV4cG9ydCBkZWZhdWx0IGluaXRTZXJ2ZXIiXX0=