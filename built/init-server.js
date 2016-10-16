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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluaXQtc2VydmVyLmpzIl0sIm5hbWVzIjpbImxvZ3NTY2hlbWEiLCJvYmplY3QiLCJrZXlzIiwiY29uc29sZSIsImJvb2xlYW4iLCJkZWZhdWx0IiwiYXBpQ29uZmlndXJhdGlvblNjaGVtYSIsIm5hbWUiLCJzdHJpbmciLCJyZXF1aXJlZCIsInZlcnNpb24iLCJyb3V0ZXMiLCJhcnJheSIsIml0ZW1zIiwiaGFzRG9jdW1lbnRhdGlvbiIsInVzZXNBdXRoZW50aWNhdGlvbiIsImdsb2JhbFRpbWVvdXQiLCJudW1iZXIiLCJpbnRlZ2VyIiwibWluIiwiY29uZmlndXJhdGlvblNjaGVtYSIsImxvZ3MiLCJhcGkiLCJzZXJ2ZXIiLCJjb25uZWN0aW9ucyIsImluaXRTZXJ2ZXIiLCJyYXdDb25maWd1cmF0aW9uIiwiY29uZmlndXJhdGlvbiIsInZhbGlkYXRlIiwiZXJyIiwidmFsdWUiLCJsb2dzQ29uZmlndXJhdGlvbiIsImFwaUNvbmZpZ3VyYXRpb24iLCJwbHVnaW5zIiwidHJhbnNwb3J0cyIsInB1c2giLCJDb25zb2xlIiwibG9nZ2VyIiwiTG9nZ2VyIiwiU2VydmVyIiwiZm9yRWFjaCIsImNvbm5lY3Rpb24iLCJoYXBpU3dhZ2dlckNvbmZpZ3VyYXRpb24iLCJpbmZvIiwidGl0bGUiLCJyZXF1aXJlIiwicmVnaXN0ZXIiLCJvcHRpb25zIiwiZXh0IiwicmVxdWVzdCIsInJlcGx5IiwicmVzcG9uc2UiLCJ1bmRlZmluZWQiLCJwYXRoIiwiaW5kZXhPZiIsImNvbnRpbnVlIiwiaXNCb29tIiwib3V0cHV0Iiwic3RhdHVzQ29kZSIsImxvZyIsImVycm9yIiwic3RhdHVzIiwicGF5bG9hZCIsInRvTG93ZXJDYXNlIiwiY29kZSIsInNvdXJjZSIsImV4dGVuZCIsIkVycm9yIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyb3V0ZSIsImNvbmZpZyIsInRpbWVvdXQiLCJ0YWdzIiwiaW5pdEhhbmRsZXIiLCJoYW5kbGVyIiwiY2F1c2VkQnkiLCJKU09OIiwic3RyaW5n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L2luaXQnXG5pbXBvcnQgSGFwaSBmcm9tICdoYXBpJ1xuaW1wb3J0IHNsdWdpZnkgZnJvbSAnc2x1Z2lmeSdcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCdcbmltcG9ydCBKb2kgZnJvbSAnam9pJ1xuaW1wb3J0IHdpbnN0b24gZnJvbSAnd2luc3RvbidcbmltcG9ydCBzZXJpYWxpemVFcnJvciBmcm9tICdzZXJpYWxpemUtZXJyb3InXG5pbXBvcnQgQm9vbSBmcm9tICdib29tJ1xuaW1wb3J0IENvbmZpZ3VyYXRpb25FcnJvciBmcm9tICcuL2Vycm9yL2luaXQtc2VydmVyL2NvbmZpZ3VyYXRpb24tZXJyb3InXG5pbXBvcnQgUGx1Z2luUmVnaXN0cmF0aW9uRXJyb3IgZnJvbSAnLi9lcnJvci9pbml0LXNlcnZlci9wbHVnaW4tcmVnaXN0cmF0aW9uLWVycm9yJ1xuaW1wb3J0IE5vdEltcGxlbWVudGVkRXJyb3IgZnJvbSAnLi9lcnJvci9pbml0LXNlcnZlci9ub3QtaW1wbGVtZW50ZWQtZXJyb3InXG5pbXBvcnQgVW5jYXVnaHRFcnJvciBmcm9tICcuL2Vycm9yL2luaXQtc2VydmVyL3VuY2F1Z2h0LWVycm9yJ1xuXG5jb25zdCBsb2dzU2NoZW1hID0gSm9pLm9iamVjdCgpLmtleXMoe1xuICBjb25zb2xlOiBKb2kuYm9vbGVhbigpLmRlZmF1bHQodHJ1ZSlcbn0pLmRlZmF1bHQoe1xuICBjb25zb2xlOiB0cnVlXG59KVxuXG5jb25zdCBhcGlDb25maWd1cmF0aW9uU2NoZW1hID0gSm9pLm9iamVjdCh7XG4gIG5hbWU6IEpvaS5zdHJpbmcoKS5yZXF1aXJlZCgpLFxuICB2ZXJzaW9uOiBKb2kuc3RyaW5nKCkucmVxdWlyZWQoKSxcbiAgcm91dGVzOiBKb2kuYXJyYXkoKS5pdGVtcyhKb2kub2JqZWN0KCkpLFxuICBoYXNEb2N1bWVudGF0aW9uOiBKb2kuYm9vbGVhbigpLmRlZmF1bHQoZmFsc2UpLFxuICB1c2VzQXV0aGVudGljYXRpb246IEpvaS5ib29sZWFuKCkuZGVmYXVsdChmYWxzZSksXG4gIGdsb2JhbFRpbWVvdXQ6IEpvaS5udW1iZXIoKS5pbnRlZ2VyKCkubWluKDApLmRlZmF1bHQoMjAwMClcbn0pXG5cbmNvbnN0IGNvbmZpZ3VyYXRpb25TY2hlbWEgPSBKb2kub2JqZWN0KCkua2V5cyh7XG4gIGxvZ3M6IGxvZ3NTY2hlbWEsXG4gIGFwaTogYXBpQ29uZmlndXJhdGlvblNjaGVtYS5yZXF1aXJlZCgpLFxuICBzZXJ2ZXI6IEpvaS5vYmplY3QoKS5rZXlzKHtcbiAgICBjb25uZWN0aW9uczogSm9pXG4gICAgICAuYXJyYXkoKVxuICAgICAgLm1pbigxKVxuICAgICAgLnJlcXVpcmVkKClcbiAgfSkucmVxdWlyZWQoKVxufSlcblxuZnVuY3Rpb24gaW5pdFNlcnZlcihyYXdDb25maWd1cmF0aW9uKSB7XG4gIGxldCBjb25maWd1cmF0aW9uXG5cbiAgSm9pLnZhbGlkYXRlKFxuICAgIHsgY29uZmlndXJhdGlvbjogcmF3Q29uZmlndXJhdGlvbiB9LFxuICAgIHsgY29uZmlndXJhdGlvbjogY29uZmlndXJhdGlvblNjaGVtYS5yZXF1aXJlZCgpIH0sXG4gICAgKGVyciwgdmFsdWUpID0+IHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgdGhyb3cgbmV3IENvbmZpZ3VyYXRpb25FcnJvcignJywgZXJyKVxuICAgICAgfVxuXG4gICAgICBjb25maWd1cmF0aW9uID0gdmFsdWUuY29uZmlndXJhdGlvblxuICAgIH1cbiAgKVxuXG4gIGNvbnN0IGxvZ3NDb25maWd1cmF0aW9uID0gY29uZmlndXJhdGlvbi5sb2dzXG4gIGNvbnN0IGFwaUNvbmZpZ3VyYXRpb24gPSBjb25maWd1cmF0aW9uLmFwaVxuICBjb25zdCBnbG9iYWxUaW1lb3V0ID0gY29uZmlndXJhdGlvbi5hcGkuZ2xvYmFsVGltZW91dFxuICBjb25zdCBjb25uZWN0aW9ucyA9IGNvbmZpZ3VyYXRpb24uc2VydmVyLmNvbm5lY3Rpb25zXG4gIGNvbnN0IHBsdWdpbnMgPSBbXVxuICBjb25zdCB0cmFuc3BvcnRzID0gW11cblxuICBpZiAobG9nc0NvbmZpZ3VyYXRpb24uY29uc29sZSkge1xuICAgIHRyYW5zcG9ydHMucHVzaChuZXcgKHdpbnN0b24udHJhbnNwb3J0cy5Db25zb2xlKSgpKVxuICB9XG5cbiAgY29uc3QgbG9nZ2VyID0gbmV3ICh3aW5zdG9uLkxvZ2dlcikoe1xuICAgIHRyYW5zcG9ydHNcbiAgfSlcblxuICBjb25zdCBzZXJ2ZXIgPSBuZXcgSGFwaS5TZXJ2ZXIoKVxuXG4gIGNvbm5lY3Rpb25zLmZvckVhY2goKGNvbm5lY3Rpb24pID0+IHtcbiAgICBzZXJ2ZXIuY29ubmVjdGlvbihjb25uZWN0aW9uKVxuICB9KVxuXG4gIGlmIChhcGlDb25maWd1cmF0aW9uLmhhc0RvY3VtZW50YXRpb24pIHtcbiAgICBjb25zdCBoYXBpU3dhZ2dlckNvbmZpZ3VyYXRpb24gPSB7XG4gICAgICBpbmZvOiB7XG4gICAgICAgIHRpdGxlOiBhcGlDb25maWd1cmF0aW9uLm5hbWUgKyAnIGRvY3VtZW50YXRpb24nLFxuICAgICAgICB2ZXJzaW9uOiBhcGlDb25maWd1cmF0aW9uLnZlcnNpb24sXG4gICAgICB9XG4gICAgfVxuXG4gICAgcGx1Z2lucy5wdXNoKHJlcXVpcmUoJ2luZXJ0JykpXG4gICAgcGx1Z2lucy5wdXNoKHJlcXVpcmUoJ3Zpc2lvbicpKVxuICAgIHBsdWdpbnMucHVzaChcbiAgICAgIHtcbiAgICAgICAgcmVnaXN0ZXI6IHJlcXVpcmUoJ2hhcGktc3dhZ2dlcicpLFxuICAgICAgICBvcHRpb25zOiBoYXBpU3dhZ2dlckNvbmZpZ3VyYXRpb25cbiAgICAgIH1cbiAgICApXG4gIH1cblxuICBpZiAoYXBpQ29uZmlndXJhdGlvbi51c2VzQXV0aGVudGljYXRpb24pIHtcbiAgICAvL1RPRE9cbiAgICB0aHJvdyBuZXcgTm90SW1wbGVtZW50ZWRFcnJvcignQXV0aGVudGljYXRpb24gZmVhdHVyZSBpcyBub3QgeWV0IGltcGxlbWVudGVkLicpXG4gIH1cblxuICBzZXJ2ZXIuZXh0KCdvblByZVJlc3BvbnNlJywgZnVuY3Rpb24gKHJlcXVlc3QsIHJlcGx5KSB7XG4gICAgY29uc3QgcmVzcG9uc2UgPSByZXF1ZXN0LnJlc3BvbnNlO1xuXG4gICAgaWYgKHVuZGVmaW5lZCAhPT0gcmVzcG9uc2UucmVxdWVzdCAmJiByZXNwb25zZS5yZXF1ZXN0LnBhdGguaW5kZXhPZignL2FwaScpICE9PSAwKSB7XG4gICAgICByZXR1cm4gcmVwbHkuY29udGludWUoKVxuICAgIH1cblxuICAgIGlmIChyZXNwb25zZS5pc0Jvb20pIHtcbiAgICAgIGlmICg1MDAgPT09IHJlc3BvbnNlLm91dHB1dC5zdGF0dXNDb2RlKSB7XG4gICAgICAgIGxvZ2dlci5sb2coXG4gICAgICAgICAgJ2Vycm9yJyxcbiAgICAgICAgICAnVW5jYXVnaHQgaW50ZXJuYWwgc2VydmVyIGVycm9yJyxcbiAgICAgICAgICB7IGVycm9yOiBzZXJpYWxpemVFcnJvcihyZXNwb25zZSkgfVxuICAgICAgICApXG4gICAgICB9IGVsc2UgaWYgKDUwMyA9PT0gcmVzcG9uc2Uub3V0cHV0LnN0YXR1c0NvZGUpIHtcbiAgICAgICAgbG9nZ2VyLmxvZyhcbiAgICAgICAgICAnZXJyb3InLFxuICAgICAgICAgICdTZXJ2aWNlIHVuYXZhaWxhYmxlJyxcbiAgICAgICAgICB7IGVycm9yOiBzZXJpYWxpemVFcnJvcihyZXNwb25zZSkgfVxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXBseShcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1czogc2x1Z2lmeShyZXNwb25zZS5vdXRwdXQucGF5bG9hZC5lcnJvciwgJ18nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIH1cbiAgICAgIClcbiAgICAgICAgLmNvZGUocmVzcG9uc2Uub3V0cHV0LnN0YXR1c0NvZGUpXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHN0YXR1c0NvZGUgPSByZXNwb25zZS5zdGF0dXNDb2RlXG5cbiAgICAgIGlmICgyMDAgPT09IHN0YXR1c0NvZGUpIHtcbiAgICAgICAgbGV0IHNvdXJjZVxuXG4gICAgICAgIGlmIChudWxsID09PSByZXNwb25zZS5zb3VyY2UpIHtcbiAgICAgICAgICBzb3VyY2UgPSB7IHN0YXR1czogJ3N1Y2Nlc3MnIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzb3VyY2UgPSBfLmV4dGVuZCh7IHN0YXR1czogJ3N1Y2Nlc3MnIH0sIHJlc3BvbnNlLnNvdXJjZSlcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXBseShzb3VyY2UpXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKCdVbmhhbmRsZWQgcmVzcG9uc2UuJylcbiAgfSlcblxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICBzZXJ2ZXIucmVnaXN0ZXIoXG4gICAgICBwbHVnaW5zLFxuICAgICAgKGVycikgPT4ge1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFBsdWdpblJlZ2lzdHJhdGlvbkVycm9yKCcnLCBlcnIpXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByb3V0ZXMgPSBhcGlDb25maWd1cmF0aW9uLnJvdXRlc1xuXG4gICAgICAgIGlmICh1bmRlZmluZWQgIT09IHJvdXRlcykge1xuICAgICAgICAgIHJvdXRlcy5mb3JFYWNoKChyb3V0ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHVuZGVmaW5lZCA9PT0gcm91dGUuY29uZmlnKSB7XG4gICAgICAgICAgICAgIHJvdXRlLmNvbmZpZyA9IHt9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh1bmRlZmluZWQgPT09IHJvdXRlLmNvbmZpZy50aW1lb3V0KSB7XG4gICAgICAgICAgICAgIHJvdXRlLmNvbmZpZy50aW1lb3V0ID0ge31cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHVuZGVmaW5lZCA9PT0gcm91dGUuY29uZmlnLnRpbWVvdXQuc2VydmVyKSB7XG4gICAgICAgICAgICAgIHJvdXRlLmNvbmZpZy50aW1lb3V0LnNlcnZlciA9IGdsb2JhbFRpbWVvdXRcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHVuZGVmaW5lZCA9PT0gcm91dGUuY29uZmlnLnRhZ3MpIHtcbiAgICAgICAgICAgICAgcm91dGUuY29uZmlnLnRhZ3MgPSBbXVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocm91dGUuY29uZmlnLnRhZ3MuaW5kZXhPZignYXBpJykgPT09IC0xKSB7XG4gICAgICAgICAgICAgIHJvdXRlLmNvbmZpZy50YWdzLnB1c2goJ2FwaScpXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGluaXRIYW5kbGVyID0gcm91dGUuaGFuZGxlclxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFdvcmtzIGFyb3VuZCBhIGJ1Zy5cbiAgICAgICAgICAgICAqIFRvIHJlcHJvZHVjZSB0aGlzIGJ1ZzpcbiAgICAgICAgICAgICAqICogdGhyb3cgYW4gZXhjZXB0aW9uIGluIGEgaGFuZGxlclxuICAgICAgICAgICAgICogKiBuZXh0IHRyeSBhbm90aGVyIHJlcXVlc3Q6IGl0IGhhbmdzXG4gICAgICAgICAgICAgKiAqIGFib3J0XG4gICAgICAgICAgICAgKiAqIHRyeSBhbm90aGVyIHJlcXVlc3Q6IHRoaXMgb25lIGRvZXMgbm90IGhhbmdcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcm91dGUuaGFuZGxlciA9IChyZXF1ZXN0LCByZXBseSkgPT4ge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpbml0SGFuZGxlcihyZXF1ZXN0LCByZXBseSlcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgbGV0IGNhdXNlZEJ5XG5cbiAgICAgICAgICAgICAgICBpZiAoZXJyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgIGNhdXNlZEJ5ID0gZXJyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGNhdXNlZEJ5ID0gbmV3IEVycm9yKEpTT04uc3RyaW5naWZ5KHsgJ2lzTm90RXJyb3InOiB0cnVlLCBlcnI6IGVyciB9KSlcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVwbHkoXG4gICAgICAgICAgICAgICAgICBCb29tLndyYXAoXG4gICAgICAgICAgICAgICAgICAgIG5ldyBVbmNhdWdodEVycm9yKCcnLCBjYXVzZWRCeSlcbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VydmVyLnJvdXRlKHJvdXRlKVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICByZXNvbHZlKHNlcnZlcilcbiAgICAgIH1cbiAgICApXG4gIH0pXG59XG5cbmV4cG9ydCBkZWZhdWx0IGluaXRTZXJ2ZXIiXX0=