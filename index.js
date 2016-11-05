/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var chalk = require('chalk');
var logRequestWare = require('./private/log-request.middleware');
var getVerbColor = require('./private/get-verb-color');


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
        dontLogParams: [
          'password',
          'token'
        ],

        // When request starts...
        onRequest: function onRequest(report, req, res) {
          // Defaults to doing nothing
        },

        // When response has finished...
        onResponse: function onResponse(report, req, res) {

          // Determine appropriate indentation string.
          var indentation = (function indentation() {
            var numChars = report.method.length + (report.path ? report.path.length : report.diagnostic.url.length);
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

          // Make HTTP method (i.e. verb) more attractive.
          var displayMethod = chalk[getVerbColor(report.method)](report.method);

          // Build formatted output.
          var formattedOutput = util.format(
            chalk.bold(chalk.gray('<-')) + ' %s %s ' + indentation + chalk.gray('(%sms)'),
            displayMethod, report.path, report.responseTime
          );

          // Now log it.
          console.log(formattedOutput);

        }//</default `sails.config.apianalytics.onResponse` notifier>

      }//</definition of default `sails.config.apianalytics` dictionary>

    },//</defaults>


    /**
     * Method that runs automatically when the hook initializes itself.
     *
     * @param   {Function}  next    Callback function to call after all is done
     */
    initialize: function initialize(next) {
      sails.log.debug('Initializing `apianalytics` hook...  (requests to monitored routes will be logged!)');

      sails.on('router:before', function routerBefore() {

        _.each(sails.config.apianalytics.routesToLog, function iterator(routeAddress) {
          sails.router.bind(routeAddress, logRequestWare);
        });

      });//</bind router:before event>

      return next();

    }//</initialize>

  };
};
