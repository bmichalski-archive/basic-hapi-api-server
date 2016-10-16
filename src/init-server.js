import './init'
import Hapi from 'hapi'
import slugify from 'slugify'
import _ from 'lodash'
import Joi from 'joi'
import winston from 'winston'
import serializeError from 'serialize-error'
import Boom from 'boom'
import ConfigurationError from './error/init-server/configuration-error'
import PluginRegistrationError from './error/init-server/plugin-registration-error'
import NotImplementedError from './error/init-server/not-implemented-error'
import UncaughtError from './error/init-server/uncaught-error'

const logsSchema = Joi.object().keys({
  console: Joi.boolean().default(true)
}).default({
  console: true
})

const apiConfigurationSchema = Joi.object({
  name: Joi.string().required(),
  version: Joi.string().required(),
  routes: Joi.array().items(Joi.object()),
  hasDocumentation: Joi.boolean().default(false),
  usesAuthentication: Joi.boolean().default(false),
  globalTimeout: Joi.number().integer().min(0).default(2000)
})

const configurationSchema = Joi.object().keys({
  logs: logsSchema,
  api: apiConfigurationSchema.required(),
  server: Joi.object().keys({
    connections: Joi
      .array()
      .min(1)
      .items(
        Joi.object().keys({
          port: Joi.number().required().min(0).max(65535)
        })
      )
      .required()
  }).required()
})

function initServer(rawConfiguration) {
  let configuration

  Joi.validate(
    { configuration: rawConfiguration },
    { configuration: configurationSchema.required() },
    (err, value) => {
      if (err) {
        throw new ConfigurationError('', err)
      }

      configuration = value.configuration
    }
  )

  const logsConfiguration = configuration.logs
  const apiConfiguration = configuration.api
  const globalTimeout = configuration.api.globalTimeout
  const connections = configuration.server.connections
  const plugins = []
  const transports = []

  if (logsConfiguration.console) {
    transports.push(new (winston.transports.Console)())
  }

  const logger = new (winston.Logger)({
    transports
  })

  const server = new Hapi.Server()

  connections.forEach((connection) => {
    server.connection(connection)
  })

  if (apiConfiguration.hasDocumentation) {
    const hapiSwaggerConfiguration = {
      info: {
        title: apiConfiguration.name + ' documentation',
        version: apiConfiguration.version,
      }
    }

    plugins.push(require('inert'))
    plugins.push(require('vision'))
    plugins.push(
      {
        register: require('hapi-swagger'),
        options: hapiSwaggerConfiguration
      }
    )
  }

  if (apiConfiguration.usesAuthentication) {
    //TODO
    throw new NotImplementedError('Authentication feature is not yet implemented.')
  }

  server.ext('onPreResponse', function (request, reply) {
    const response = request.response;

    if (undefined !== response.request && response.request.path.indexOf('/api') !== 0) {
      return reply.continue()
    }

    if (response.isBoom) {
      if (500 === response.output.statusCode) {
        logger.log(
          'error',
          'Uncaught internal server error',
          { error: serializeError(response) }
        )
      } else if (503 === response.output.statusCode) {
        logger.log(
          'error',
          'Service unavailable',
          { error: serializeError(response) }
        )
      }

      return reply(
        {
          status: slugify(response.output.payload.error, '_').toLowerCase()
        }
      )
        .code(response.output.statusCode)
    } else {
      const statusCode = response.statusCode

      if (200 === statusCode) {
        let source

        if (null === response.source) {
          source = { status: 'success' }
        } else {
          source = _.extend({ status: 'success' }, response.source)
        }

        return reply(source)
      }
    }

    throw new Error('Unhandled response.')
  })

  return new Promise((resolve) => {
    server.register(
      plugins,
      (err) => {
        if (err) {
          throw new PluginRegistrationError('', err)
        }

        const routes = apiConfiguration.routes

        if (undefined !== routes) {
          routes.forEach((route) => {
            if (undefined === route.config) {
              route.config = {}
            }

            if (undefined === route.config.timeout) {
              route.config.timeout = {}
            }

            if (undefined === route.config.timeout.server) {
              route.config.timeout.server = globalTimeout
            }

            if (undefined === route.config.tags) {
              route.config.tags = []
            }

            if (route.config.tags.indexOf('api') === -1) {
              route.config.tags.push('api')
            }

            const initHandler = route.handler

            /**
             * Works around a bug.
             * To reproduce this bug:
             * * throw an exception in a handler
             * * next try another request: it hangs
             * * abort
             * * try another request: this one does not hang
             */
            route.handler = (request, reply) => {
              try {
                return initHandler(request, reply)
              } catch (err) {
                let causedBy

                if (err instanceof Error) {
                  causedBy = err
                } else {
                  causedBy = new Error(JSON.stringify({ 'isNotError': true, err: err }))
                }

                return reply(
                  Boom.wrap(
                    new UncaughtError('', causedBy)
                  )
                )
              }
            }

            server.route(route)
          })
        }

        resolve(server)
      }
    )
  })
}

export default initServer