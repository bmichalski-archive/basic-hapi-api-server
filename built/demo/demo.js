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
        description: 'Hello world'
      }
    }, {
      method: 'GET',
      path: '/internal-server-error',
      handler: function handler() {
        throw new Error('err');
      }
    }, {
      method: 'GET',
      path: '/internal-server-error-not-obj',
      handler: function handler() {
        throw 'err';
      }
    }, {
      method: 'GET',
      path: '/promise-unhandled-rejection',
      handler: function handler(request, reply) {
        reply(new Promise(function () {
          throw new Error('err');
        }));
      }
    }, {
      method: 'GET',
      path: '/promise-unhandled-rejection-not-obj',
      handler: function handler(request, reply) {
        reply(new Promise(function () {
          throw 'err';
        }));
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
        }
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
      description: 'Hello world'
    }
  });
}

(0, _initServer2.default)(config).then(function (server) {
  server.start(function () {
    console.log('Server started, listening on port ' + port + ' ' + (usesAuthentication ? 'with authentication' : ''));
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRlbW8vZGVtby5qcyJdLCJuYW1lcyI6WyJwb3J0IiwicHJvY2VzcyIsImVudiIsIkRFTU9fUE9SVCIsInVuZGVmaW5lZCIsInVzZXNBdXRoZW50aWNhdGlvbiIsIkRFTU9fQVVUSEVOVElDQVRJT04iLCJwYXJzZUludCIsImF1dGhlbnRpY2F0aW9uU3RyYXRlZ2llcyIsIm5hbWUiLCJ2YWxpZGF0ZSIsInJlcXVlc3QiLCJ1c2VybmFtZSIsInBhc3N3b3JkIiwiY2FsbGJhY2siLCJpc1ZhbGlkIiwiaWQiLCJjb25maWciLCJhcGkiLCJ2ZXJzaW9uIiwiaGFzRG9jdW1lbnRhdGlvbiIsInJvdXRlcyIsIm1ldGhvZCIsInBhdGgiLCJoYW5kbGVyIiwicmVwbHkiLCJoZWxsbyIsImRlc2NyaXB0aW9uIiwiUHJvbWlzZSIsInJlc29sdmUiLCJFcnJvciIsInRpbWVvdXQiLCJzZXJ2ZXIiLCJjb25uZWN0aW9ucyIsInB1c2giLCJhdXRoIiwidGhlbiIsInN0YXJ0IiwiY29uc29sZSIsImxvZyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7O0FBQ0EsSUFBTUEsT0FBT0MsUUFBUUMsR0FBUixDQUFZQyxTQUFaLEtBQTBCQyxTQUExQixHQUFzQyxJQUF0QyxHQUE2Q0gsUUFBUUMsR0FBUixDQUFZQyxTQUF0RTtBQUNBLElBQU1FLHFCQUFxQkosUUFBUUMsR0FBUixDQUFZSSxtQkFBWixLQUFvQ0YsU0FBcEMsR0FBZ0QsS0FBaEQsR0FBd0QsTUFBTUcsU0FBU04sUUFBUUMsR0FBUixDQUFZSSxtQkFBckIsRUFBMEMsRUFBMUMsQ0FBekY7O0FBRUEsSUFBSUUsaUNBQUo7O0FBRUEsSUFBSUgsa0JBQUosRUFBd0I7QUFDdEJHLDZCQUEyQixDQUN6QjtBQUNFQyxVQUFNLFFBRFI7QUFFRUMsY0FBVSxrQkFBVUMsT0FBVixFQUFtQkMsUUFBbkIsRUFBNkJDLFFBQTdCLEVBQXVDQyxRQUF2QyxFQUFpRDtBQUN6RCxVQUFNQyxVQUFVSCxhQUFhLE9BQWIsSUFBd0JDLGFBQWEs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O0FBR0QsQ0FKRCIsImZpbGUiOiJkZW1vL2RlbW8uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgaW5pdFNlcnZlciBmcm9tICcuLi9pbml0LXNlcnZlcidcbmNvbnN0IHBvcnQgPSBwcm9jZXNzLmVudi5ERU1PX1BPUlQgPT09IHVuZGVmaW5lZCA/IDgwODAgOiBwcm9jZXNzLmVudi5ERU1PX1BPUlRcbmNvbnN0IHVzZXNBdXRoZW50aWNhdGlvbiA9IHByb2Nlc3MuZW52LkRFTU9fQVVUSEVOVElDQVRJT04gPT09IHVuZGVmaW5lZCA/IGZhbHNlIDogMSA9PT0gcGFyc2VJbnQocHJvY2Vzcy5lbnYuREVNT19BVVRIRU5USUNBVElPTiwgMTApXG5cbmxldCBhdXRoZW50aWNhdGlvblN0cmF0ZWdpZXNcblxuaWYgKHVzZXNBdXRoZW50aWNhdGlvbikge1xuICBhdXRoZW50aWNhdGlvblN0cmF0ZWdpZXMgPSBbXG4gICAge1xuICAgICAgbmFtZTogJ3NpbXBsZScsXG4gICAgICB2YWxpZGF0ZTogZnVuY3Rpb24gKHJlcXVlc3QsIHVzZXJuYW1lLCBwYXNzd29yZCwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgaXNWYWxpZCA9IHVzZXJuYW1lID09PSAnaGVsbG8nICYmIHBhc3N3b3JkID09PSAnd29ybGQnXG5cbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIGlzVmFsaWQsIHsgaWQ6IDQyIH0pXG4gICAgICB9XG4gICAgfVxuICBdXG59IGVsc2Uge1xuICBhdXRoZW50aWNhdGlvblN0cmF0ZWdpZXMgPSBbXVxufVxuXG5jb25zdCBjb25maWcgPSB7XG4gIGFwaToge1xuICAgIG5hbWU6ICdEZW1vIHNlcnZlcicsXG4gICAgdmVyc2lvbjogJzEnLFxuICAgIGhhc0RvY3VtZW50YXRpb246IHRydWUsXG4gICAgcm91dGVzOiBbXG4gICAgICB7XG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIHBhdGg6Jy9oZWxsby13b3JsZCcsXG4gICAgICAgIGhhbmRsZXI6IChyZXF1ZXN0LCByZXBseSkgPT4ge1xuICAgICAgICAgIHJlcGx5KHtcbiAgICAgICAgICAgIGhlbGxvOiAnd29ybGQnXG4gICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgZGVzY3JpcHRpb246ICdIZWxsbyB3b3JsZCdcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgcGF0aDonL2hlbGxvLXdvcmxkLXByb21pc2UnLFxuICAgICAgICBoYW5kbGVyOiAocmVxdWVzdCwgcmVwbHkpID0+IHtcbiAgICAgICAgICByZXBseShuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoe1xuICAgICAgICAgICAgICBoZWxsbzogJ3dvcmxkJ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9KSlcbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgZGVzY3JpcHRpb246ICdIZWxsbyB3b3JsZCdcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgcGF0aDonL2ludGVybmFsLXNlcnZlci1lcnJvcicsXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2VycicpXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIHBhdGg6Jy9pbnRlcm5hbC1zZXJ2ZXItZXJyb3Itbm90LW9iaicsXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB0aHJvdyAnZXJyJ1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICBwYXRoOicvcHJvbWlzZS11bmhhbmRsZWQtcmVqZWN0aW9uJyxcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24gKHJlcXVlc3QsIHJlcGx5KSB7XG4gICAgICAgICAgcmVwbHkobmV3IFByb21pc2UoKCkgPT4ge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdlcnInKVxuICAgICAgICAgIH0pKVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICBwYXRoOicvcHJvbWlzZS11bmhhbmRsZWQtcmVqZWN0aW9uLW5vdC1vYmonLFxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbiAocmVxdWVzdCwgcmVwbHkpIHtcbiAgICAgICAgICByZXBseShuZXcgUHJvbWlzZSgoKSA9PiB7XG4gICAgICAgICAgICB0aHJvdyAnZXJyJ1xuICAgICAgICAgIH0pKVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICBwYXRoOicvdGltZW91dCcsXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAvL0RvIG5vdGhpbmcgYW5kIHdhaXQgZm9yIHRpbWVvdXRcbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgdGltZW91dDoge1xuICAgICAgICAgICAgc2VydmVyOiAyMDBcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBdLFxuICAgIHVzZXNBdXRoZW50aWNhdGlvbixcbiAgICBhdXRoZW50aWNhdGlvblN0cmF0ZWdpZXNcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgY29ubmVjdGlvbnM6IFtcbiAgICAgIHtcbiAgICAgICAgcG9ydDogcG9ydFxuICAgICAgfVxuICAgIF1cbiAgfVxufVxuXG5pZiAodXNlc0F1dGhlbnRpY2F0aW9uKSB7XG4gIGNvbmZpZy5hcGkucm91dGVzLnB1c2goe1xuICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgcGF0aDonL2hlbGxvLXdvcmxkLXByb3RlY3RlZCcsXG4gICAgaGFuZGxlcjogKHJlcXVlc3QsIHJlcGx5KSA9PiB7XG4gICAgICByZXBseSh7XG4gICAgICAgIGhlbGxvOiAnd29ybGQnXG4gICAgICB9KVxuICAgIH0sXG4gICAgY29uZmlnOiB7XG4gICAgICBhdXRoOiAnc2ltcGxlJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnSGVsbG8gd29ybGQnXG4gICAgfVxuICB9KVxufVxuXG5pbml0U2VydmVyKGNvbmZpZykudGhlbigoc2VydmVyKSA9PiB7XG4gIHNlcnZlci5zdGFydCgoKSA9PiB7XG4gICAgY29uc29sZS5sb2coYFNlcnZlciBzdGFydGVkLCBsaXN0ZW5pbmcgb24gcG9ydCAke3BvcnR9ICR7dXNlc0F1dGhlbnRpY2F0aW9uID8gJ3dpdGggYXV0aGVudGljYXRpb24nOiAnJ31gKVxuICB9KVxufSlcbiJdfQ==