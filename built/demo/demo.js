'use strict';

var _initServer = require('../init-server');

var _initServer2 = _interopRequireDefault(_initServer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var port = process.env.DEMO_PORT === undefined ? 8080 : process.env.DEMO_PORT;
var usesAuthentication = process.env.DEMO_AUTHENTICATION === undefined ? false : 1 === parseInt(process.env.DEMO_AUTHENTICATION, 10);

(0, _initServer2.default)({
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
    usesAuthentication: usesAuthentication
  },
  server: {
    connections: [{
      port: port
    }]
  }
}).then(function (server) {
  server.start(function () {
    console.log('Server started, listening on port ' + port);
  });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRlbW8vZGVtby5qcyJdLCJuYW1lcyI6WyJwb3J0IiwicHJvY2VzcyIsImVudiIsIkRFTU9fUE9SVCIsInVuZGVmaW5lZCIsInVzZXNBdXRoZW50aWNhdGlvbiIsIkRFTU9fQVVUSEVOVElDQVRJT04iLCJwYXJzZUludCIsImFwaSIsIm5hbWUiLCJ2ZXJzaW9uIiwiaGFzRG9jdW1lbnRhdGlvbiIsInJvdXRlcyIsIm1ldGhvZCIsInBhdGgiLCJoYW5kbGVyIiwicmVxdWVzdCIsInJlcGx5IiwiaGVsbG8iLCJjb25maWciLCJkZXNjcmlwdGlvbiIsIlByb21pc2UiLCJyZXNvbHZlIiwiRXJyb3IiLCJ0aW1lb3V0Iiwic2VydmVyIiwiY29ubmVjdGlvbnMiLCJ0aGVuIiwic3RhcnQiLCJjb25zb2xlIiwibG9nIl0sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7QUFDQSxJQUFNQSxPQUFPQyxRQUFRQyxHQUFSLENBQVlDLFNBQVosS0FBMEJDLFNBQTFCLEdBQXNDLElBQXRDLEdBQTZDSCxRQUFRQyxHQUFSLENBQVlDLFNBQXRFO0FBQ0EsSUFBTUUscUJBQXFCSixRQUFRQyxHQUFSLENBQVlJLG1CQUFaLEtBQW9DRixTQUFwQyxHQUFnRCxLQUFoRCxHQUF3RCxNQUFNRyxTQUFTTixRQUFRQyxHQUFSLENBQVlJLG1CQUFyQixFQUEwQyxFQUExQyxDQUF6Rjs7QUFFQSwwQkFBVztBQUNURSxPQUFLO0FBQ0hDLFVBQU0sYUFESDtBQUVIQyxhQUFTLEdBRk47QUFHSEMsc0JBQWtCLElBSGY7QUFJSEMsWUFBUSxDQUNOO0FBQ0VDLGNBQVEsS0FEVjtBQUVFQyxZQUFLLGNBRlA7QUFHRUMsZUFBUyxpQkFBQ0MsT0FBRCxFQUFVQyxLQUFWLEVBQW9CO0FBQzNCQSxjQUFNO0FBQ0pDLGlCQUFPO0FBREgsU0FBTjtBQUdELE9BUEg7QUFRRUMsY0FBUTtBQUNOQyxxQkFBYTtBQURQO0FBUlYsS0FETSxFQWFOO0FBQ0VQLGNBQVEsS0FEVjtBQUVFQyxZQUFLLHNCQUZQO0FBR0VDLGVBQVMsaUJBQUNDLE9BQUQsRUFBVUMsS0FBVixFQUFvQjtBQUMzQkEsY0FBTSxJQUFJSSxPQUFKLENBQVksVUFBQ0MsT0FBRCxFQUFhO0FBQzdCLGlCQUFPQSxRQUFRO0FBQ2JKLG1CQUFPO0FBRE0sV0FBUixDQUFQO0FBR0QsU0FKSyxDQUFOO0FBS0QsT0FUSDtBQVVFQyxjQUFRO0FBQ05DLHFCQUFhO0FBRFA7QUFWVixLQWJNLEVBMkJOO0FBQ0VQLGNBQVEsS0FEVjtBQUVFQyxZQUFLLHdCQUZQO0FBR0VDLGVBQVMsbUJBQVk7QUFDbkIsY0FBTSxJQUFJUSxLQUFKLENBQVUsS0FBVixDQUFOO0FBQ0Q7QUFMSCxLQTNCTSxFQWtDTjtBQUNFVixjQUFRLEtBRFY7QUFFRUMsWUFBSyxnQ0FGUDtBQUdFQyxlQUFTLG1CQUFZO0FBQ25CLGNBQU0sS0FBTjtBQUNEO0FBTEgsS0FsQ00sRUF5Q047QUFDRUYsY0FBUSxLQURWO0FBRUVDLFlBQUssOEJBRlA7QUFHRUMsZUFBUyxpQkFBVUMsT0FBVixFQUFtQkMsS0FBbkIsRUFBMEI7QUFDakNBLGNBQU0sSUFBSUksT0FBSixDQUFZLFlBQU07QUFDdEIsZ0JBQU0sSUFBSUUsS0FBSixDQUFVLEtBQVYsQ0FBTjtBQUNELFNBRkssQ0FBTjtBQUdEO0FBUEgsS0F6Q00sRUFrRE47QUFDRVYsY0FBUSxLQURWO0FBRUVDLFlBQUssc0NBRlA7QUFHRUMsZUFBUyxpQkFBVUMsT0FBVixFQUFtQkMsS0FBbkIsRUFBMEI7QUFDakNBLGNBQU0sSUFBSUksT0FBSixDQUFZLFlBQU07QUFDdEIsZ0JBQU0sS0FBTjtBQUNELFNBRkssQ0FBTjtBQUdEO0FBUEgsS0FsRE0sRUEyRE47QUFDRVIsY0FBUSxLQURWO0FBRUVDLFlBQUssVUFGUDtBQUdFQyxlQUFTLG1CQUFZO0FBQ25CO0FBQ0QsT0FMSDtBQU1FSSxjQUFRO0FBQ05LLGlCQUFTO0FBQ1BDLGtCQUFRO0FBREQ7QUFESDtBQU5WLEtBM0RNLENBSkw7QUE0RUhwQjtBQTVFRyxHQURJO0FBK0VUb0IsVUFBUTtBQUNOQyxpQkFBYSxDQUNYO0FBQ0UxQixZQUFNQTtBQURSLEtBRFc7QUFEUDtBQS9FQyxDQUFYLEVBc0ZHMkIsSUF0RkgsQ0FzRlEsVUFBQ0YsTUFBRCxFQUFZO0FBQ2xCQSxTQUFPRyxLQUFQLENBQWEsWUFBTTtBQUNqQkMsWUFBUUMsR0FBUixDQUFZLHVDQUF1QzlCLElBQW5EO0FBQ0QsR0FGRDtBQUdELENBMUZEIiwiZmlsZSI6ImRlbW8vZGVtby5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBpbml0U2VydmVyIGZyb20gJy4uL2luaXQtc2VydmVyJ1xuY29uc3QgcG9ydCA9IHByb2Nlc3MuZW52LkRFTU9fUE9SVCA9PT0gdW5kZWZpbmVkID8gODA4MCA6IHByb2Nlc3MuZW52LkRFTU9fUE9SVFxuY29uc3QgdXNlc0F1dGhlbnRpY2F0aW9uID0gcHJvY2Vzcy5lbnYuREVNT19BVVRIRU5USUNBVElPTiA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiAxID09PSBwYXJzZUludChwcm9jZXNzLmVudi5ERU1PX0FVVEhFTlRJQ0FUSU9OLCAxMClcblxuaW5pdFNlcnZlcih7XG4gIGFwaToge1xuICAgIG5hbWU6ICdEZW1vIHNlcnZlcicsXG4gICAgdmVyc2lvbjogJzEnLFxuICAgIGhhc0RvY3VtZW50YXRpb246IHRydWUsXG4gICAgcm91dGVzOiBbXG4gICAgICB7XG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIHBhdGg6Jy9oZWxsby13b3JsZCcsXG4gICAgICAgIGhhbmRsZXI6IChyZXF1ZXN0LCByZXBseSkgPT4ge1xuICAgICAgICAgIHJlcGx5KHtcbiAgICAgICAgICAgIGhlbGxvOiAnd29ybGQnXG4gICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgZGVzY3JpcHRpb246ICdIZWxsbyB3b3JsZCdcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgcGF0aDonL2hlbGxvLXdvcmxkLXByb21pc2UnLFxuICAgICAgICBoYW5kbGVyOiAocmVxdWVzdCwgcmVwbHkpID0+IHtcbiAgICAgICAgICByZXBseShuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUoe1xuICAgICAgICAgICAgICBoZWxsbzogJ3dvcmxkJ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9KSlcbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgZGVzY3JpcHRpb246ICdIZWxsbyB3b3JsZCdcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgcGF0aDonL2ludGVybmFsLXNlcnZlci1lcnJvcicsXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2VycicpXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIHBhdGg6Jy9pbnRlcm5hbC1zZXJ2ZXItZXJyb3Itbm90LW9iaicsXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB0aHJvdyAnZXJyJ1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICBwYXRoOicvcHJvbWlzZS11bmhhbmRsZWQtcmVqZWN0aW9uJyxcbiAgICAgICAgaGFuZGxlcjogZnVuY3Rpb24gKHJlcXVlc3QsIHJlcGx5KSB7XG4gICAgICAgICAgcmVwbHkobmV3IFByb21pc2UoKCkgPT4ge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdlcnInKVxuICAgICAgICAgIH0pKVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICBwYXRoOicvcHJvbWlzZS11bmhhbmRsZWQtcmVqZWN0aW9uLW5vdC1vYmonLFxuICAgICAgICBoYW5kbGVyOiBmdW5jdGlvbiAocmVxdWVzdCwgcmVwbHkpIHtcbiAgICAgICAgICByZXBseShuZXcgUHJvbWlzZSgoKSA9PiB7XG4gICAgICAgICAgICB0aHJvdyAnZXJyJ1xuICAgICAgICAgIH0pKVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICBwYXRoOicvdGltZW91dCcsXG4gICAgICAgIGhhbmRsZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAvL0RvIG5vdGhpbmcgYW5kIHdhaXQgZm9yIHRpbWVvdXRcbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgdGltZW91dDoge1xuICAgICAgICAgICAgc2VydmVyOiAyMDBcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBdLFxuICAgIHVzZXNBdXRoZW50aWNhdGlvblxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBjb25uZWN0aW9uczogW1xuICAgICAge1xuICAgICAgICBwb3J0OiBwb3J0XG4gICAgICB9XG4gICAgXVxuICB9XG59KS50aGVuKChzZXJ2ZXIpID0+IHtcbiAgc2VydmVyLnN0YXJ0KCgpID0+IHtcbiAgICBjb25zb2xlLmxvZygnU2VydmVyIHN0YXJ0ZWQsIGxpc3RlbmluZyBvbiBwb3J0ICcgKyBwb3J0KVxuICB9KVxufSlcbiJdfQ==