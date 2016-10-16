const _ = require('lodash')
const expect = require('chai').expect
const cheerio = require('cheerio')
const initServer = require('../built/init-server').default
const Boom = require('boom')

const commonPort = '8080'
const commonName = 'Test server'
const commonVersion = '1'
const commonConfiguration = {
  api: {
    name: commonName,
    version: commonVersion
  },
  server: {
    connections: [
      {
        port: commonPort
      }
    ]
  }
}
const commonRoutesConfiguration = [
  {
    method: 'GET',
    path:'/hello-world',
    handler: (request, reply) => {
      reply({
        hello: 'world'
      })
    }
  }
]

describe('server', function () {
  this.slow(500)

  describe('init and start', function () {
    this.slow(200)

    it('should init given basic configuration', function () {
      initServer(commonConfiguration)
    })

    it('should init then start', function (done) {
      initServer(commonConfiguration).then((server) => {
        server.start(() => {
          done()
        })
      })
    })
  })

  describe('successful response', function () {
    function doInject(server, url, done) {
      server.inject({
        method: 'GET',
        url: url
      }, (res) => {
        expect(res.statusCode).to.equal(200)
        expect(res.result).to.deep.equal({ hello: 'world' })

        done()
      })
    }

    describe('basic', function () {
      it('should return hello world', function (done) {
        const configuration = _.cloneDeep(commonConfiguration)
        configuration.api.routes = _.cloneDeep(commonRoutesConfiguration)

        initServer(configuration).then((server) => {
          doInject(server, '/hello-world', done)
        })
      })
    })

    describe('using promise', function () {
      it('should return hello world', function (done) {
        const configuration = _.cloneDeep(commonConfiguration)
        configuration.api.routes = _.cloneDeep(commonRoutesConfiguration)

        configuration.api.routes.push({
          method: 'GET',
          path: '/hello-world-promise',
          handler: (request, reply) => {
            reply(new Promise((resolve) => {
              resolve({ hello: 'world' })
            }))
          }
        })

        initServer(configuration).then((server) => {
          doInject(server, '/hello-world-promise', done)
        })
      })
    })
  })

  describe('documentation', function () {
    it('should expose an API doc', function (done) {
      const configuration = _.cloneDeep(commonConfiguration)
      configuration.api.hasDocumentation = true
      configuration.api.routes = _.cloneDeep(commonRoutesConfiguration)
      configuration.api.routes[0].config = {
        description: 'Hello world'
      }

      initServer(configuration).then((server) => {
        const expectedTitle = 'Test server documentation'

        let doneCount = 0

        function checkIfDone() {
          doneCount += 1

          if (doneCount >= 2) {
            done()
          }
        }

        server.start(() => {
          server.inject({
            method: 'GET',
            url: '/documentation'
          }, (res) => {
            expect(res.statusCode).to.equal(200)
            const $dom = cheerio.load(res.result)

            expect($dom('head title').text().trim()).to.equal(expectedTitle)
            //TODO Validation API version

            checkIfDone()
          })

          server.inject({
            method: 'GET',
            url: '/swagger.json'
          }, (res) => {
            expect(res.statusCode).to.equal(200)

            const result = res.result

            expect(result.info.title).to.be.equal(expectedTitle)
            expect(result.info.version).to.be.equal('1')
            expect(result.paths).to.have.all.keys([ '/hello-world' ])
            expect(result.paths['/hello-world'].get.summary).to.equal('Hello world')

            checkIfDone()
          })
        })
      })
    })
  })

  //TODO Implement
  describe.skip('authentication', function () {
    describe('no authentication', function () {
      it('should return a 401', function (done) {
        const configuration = _.cloneDeep(commonConfiguration)
        configuration.api.usesAuthentication = true
        configuration.api.routes = _.cloneDeep(commonRoutesConfiguration)

        initServer(configuration).then((server) => {
          server.start(function () {
            server.inject({
              method: 'GET',
              url: '/hello-world'
            }, (res) => {
              expect(res.statusCode).to.equal(401)
              expect(res.result).to.deep.equal({ status: 'unauthorized' })

              done()
            })
          })
        })
      })
    })

    describe('correct authentication', function () {
      it('should return hello world', function (done) {
        const configuration = _.cloneDeep(commonConfiguration)
        configuration.api.usesAuthentication = true
        configuration.api.routes = _.cloneDeep(commonRoutesConfiguration)

        // const authenticationHeader = ''

        initServer(configuration).then((server) => {
          server.start(function () {
            server.inject({
              method: 'GET',
              url: '/hello-world',
              headers: {
                Authorization: authenticationHeader
              }
            }, (res) => {
              expect(res.statusCode).to.equal(200)
              expect(res.result).to.deep.equal({ hello: 'world' })

              done()
            })
          })
        })
      })
    })

    describe('wrong authentication', function () {
      //TODO
    })
  })

  describe('error handling', function () {
    describe('internal server', function () {
      function doTestInternalError(handler) {
        return new Promise((resolve) => {
          const configuration = _.cloneDeep(commonConfiguration)
          configuration.logs = {
            console: false
          }
          configuration.api.routes = _.cloneDeep(commonRoutesConfiguration)

          configuration.api.routes.push({
            method: 'GET',
            path: '/internal-server-error',
            handler: handler
          })

          initServer(configuration).then((server) => {
            server.start(function () {
              server.inject({
                method: 'GET',
                url: '/internal-server-error'
              }, (res) => {
                expect(res.statusCode).to.equal(500)
                expect(res.result).to.deep.equal({status: 'internal_server_error'})

                resolve()
              })
            })
          })
        })
      }

      function testInternalError(handler) {
        return function (done) {
          doTestInternalError(handler).then(done)
        }
      }

      function errorThrownHandler() {
        throw Error
      }

      function nonErrorThrownHandler() {
        throw ''
      }

      function promiseWithUnhandledExceptionBecauseErrorThrownHandler(request, reply) {
        return reply(new Promise(() => {
          throw new Error('err')
        }))
      }

      function promiseWithUnhandledExceptionBecauseNonErrorThrownHandler(request, reply) {
        return reply(new Promise(() => {
          throw ''
        }))
      }

      describe('given configuration', function () {
        describe('when Boom internal', function () {
          it('should return internal_error status', testInternalError(function (request, reply) {
            reply(Boom.internal())
          }))
        })
        describe('when Error thrown', function () {
          it('should return internal_error status', testInternalError(errorThrownHandler))
        })
        describe('when non Error thrown', function () {
          it('should return internal_error status', testInternalError(nonErrorThrownHandler))
        })
        describe('when given a promise with undhandled rejection because an error is thrown', function () {
          it('should return internal_error status', testInternalError(promiseWithUnhandledExceptionBecauseErrorThrownHandler))
        })
        describe('when given a promise with undhandled rejection because a non error is thrown', function () {
          it('should return internal_error status', testInternalError(promiseWithUnhandledExceptionBecauseNonErrorThrownHandler))
        })
      })
    })

    describe('not found', function () {
      it('should return not_found status', function (done) {
        const configuration = _.cloneDeep(commonConfiguration)
        configuration.api.routes = _.cloneDeep(commonRoutesConfiguration)

        initServer(configuration).then((server) => {
          server.start(function () {
            server.inject({
              method: 'GET',
              url: '/not-found'
            }, (res) => {
              expect(res.statusCode).to.equal(404)
              expect(res.result).to.deep.equal({ status: 'not_found' })

              done()
            })
          })
        })
      })
    })

    describe('service unavailable', function () {
      it('should return service_unavailable status', function (done) {
        const configuration = _.cloneDeep(commonConfiguration)
        configuration.api.routes = _.cloneDeep(commonRoutesConfiguration)
        configuration.logs = {
          console: false
        }
        configuration.api.routes.push({
          method: 'GET',
          path: '/service-unavailable',
          handler: () => {
            //No nothing but wait for timeout to happen
          },
          config: {
            timeout: {
              server: 1 //Force low timeout to speedup test
            }
          }
        })

        initServer(configuration).then((server) => {
          server.start(function () {
            server.inject({
              method: 'GET',
              url: '/service-unavailable'
            }, (res) => {
              expect(res.statusCode).to.equal(503)
              expect(res.result).to.deep.equal({ status: 'service_unavailable' })

              done()
            })
          })
        })
      })
    })
  })
})
