'use strict';

/**
 * Module dependencies
 */
var _ = require('lodash');
var chalk = require('chalk');
var logRequestWare = require('./log-request.middleware');

/**
 * sails-hook-apianalytics
 */
module.exports = function sailsHookApiAnalytics(sails) {
  return {
    /**
     * Default configuration for hook, you can override these on your own config file if needed.
     */
    defaults: {
      apianalytics: {
        /**
         * The types of requests to log
         * (e.g. ["get /foo/bar", "post /foo", "/*"])
         * Defaults to all routes.
         */
        routesToLog: [
          '/*'
        ],

        /**
         * Parameters which should NEVER be logged
         * (e.g. "password")
         * If seen, they will be replaced with "*PROTECTED*"
         */
        dontLogParams: ['password', 'token'],

        // When request starts
        onRequest: function onRequest(log, req, res) {
          // Defaults to doing nothing
        },

        // When request is done
        onResponse: function onResponse(log, req, res) {
          var indentation = (function indentation() {
            var numChars = log.method.length + (log.path ? log.path.length : log.diagnostic.url.length);
            var MARGIN = 40;

            if (MARGIN - numChars <= 0) {
              return '';
            }

            var indentation = '';

            for (var i = 0; i < (MARGIN - numChars); i++) {
              indentation += ' ';
            }

            return indentation;
          })();

          // Make HTTP verb more attractive
          var displayVerb = chalk[_getVerbColor(log.method)](log.method.toUpperCase());

          // Defaults to logging result w/ sails.log.verbose
          console.log(chalk.bold(chalk.gray('<-')) + ' %s %s ' + indentation + chalk.gray('(%sms)'), displayVerb, log.path, log.responseTime);

          if (!_.isUndefined(log.params)) {
            console.log('Params:', log.params);
          }
        }
      }
    },

    /**
     * Method that runs automatically when the hook initializes itself.
     *
     * @param   {Function}  next    Callback function to call after all is done
     */
    initialize: function initialize(next) {
      sails.log.verbose('Starting apianalytics hook- requests will be logged...');

      sails.on('router:before', function routerBefore() {
        _.forEach(sails.config.apianalytics.routesToLog, function iterator(routeAddress) {
          sails.router.bind(routeAddress, logRequestWare);
        });
      });

      next();
    }
  };
};

/**
 * Helper function to get current HTTP verb color definition for default logger.
 *
 * @param   {string}  method
 * @returns {string}
 * @private
 */
function _getVerbColor(method) {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'green';
    case 'POST':
      return 'yellow';
    case 'PUT':
      return 'blue';
    case 'DELETE':
      return 'red';
    default:
      return 'gray';
  }
}
