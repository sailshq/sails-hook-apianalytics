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

        routesToLog: [
          '/*'
        ],

        dontLogParams: [
          'password',
          'token'
        ],

        onRequest: function (report, req, res) {
          // Defaults to doing nothing
        },

        // When response has finished...
        onResponse: function (report, req, res) {

          // Determine appropriate indentation string.
          var indentation = (function () {
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

          // This will be used to hold the arrow that will be drawn at the
          // beginning of the log message.
          var displayIncomingArrow = chalk.bold.gray('<-');

          // And this one is for the status code display.
          // (we color it depending on the status code.)
          var displayStatusCode;
          if (report.statusCode >= 200 && report.statusCode < 300) {
            displayStatusCode = chalk.green(report.statusCode);// used to be '->'
          }
          else if (report.statusCode >= 300 && report.statusCode < 400) {
            displayStatusCode = chalk.white(report.statusCode);
          }
          else if (report.statusCode >= 400 && report.statusCode < 500) {
            displayStatusCode = chalk.yellow(report.statusCode);
          }
          else {
            displayStatusCode = chalk.red(report.statusCode);
          }

          // Make HTTP method (i.e. verb) and request URL path more attractive.
          var displayMethod = chalk[getVerbColor(report.method)](report.method);
          var displayPath = report.path;

          // Get display miliseconds for the response time.
          var displayMs = chalk.gray(report.responseTime+'ms');

          // If this request matched a controller action or a view, or if it is
          // anything other than a GET request, then we make it stand out more
          // brightly than the others.
          if (report.method !== 'GET' || report.target.action || report.target.controller || report.target.view || report.target.model) {
            // It's already bright!
          }
          // Otherwise this didn't seem to match an action or view, which probably
          // means it was a request for an asset.  So we'll tone it down.
          else {
            displayMethod = chalk.dim(displayMethod);
            displayPath = chalk.dim(displayPath);
            displayIncomingArrow = chalk.dim(displayIncomingArrow);
            displayMs = chalk.dim(displayMs);

            // Note, as long as the status code is a 2xx, then we completely desaturate it
            // rather than just toning it down.
            if (report.statusCode >= 200 && report.statusCode < 300) {
              displayStatusCode = chalk.gray.dim(report.statusCode);
            }
            // Otherwise, we just tone it down.
            else {
              displayStatusCode = chalk.dim(displayStatusCode);
            }
          }//>-

          // Build formatted output.
          var formattedOutput = util.format(
            '%s %s %s '+indentation+' %s',
            displayIncomingArrow,
            displayMethod,
            displayPath,
            chalk.gray('(')+displayMs+' '+displayStatusCode+chalk.gray(')')
          );

          // Now log it.
          console.log(formattedOutput);

          // If there is an X-Exit response header, then include it.
          // (plus additional info, if available)
          if (!_.isUndefined(report.responseHeaders['x-exit'])) {


            // Get an appropriate friendly name for this exit.
            var friendlifiedExitName;
            if (!_.isUndefined(report.responseHeaders['x-exit-friendly-name'])) {
              friendlifiedExitName = report.responseHeaders['x-exit-friendly-name'];
            }
            else {
              friendlifiedExitName = _.map(_.words(report.responseHeaders['x-exit']), function(word, i){
                if (i === 0) { return word; }
                word = word[0].toLowerCase() + word.slice(1);
                return word;
              }).join(' ');
            }//>-

            // Determine the prefix to use for this additional metadata.
            var PREFIX = chalk.gray(' |  ');


            // Now log the friendlified exit name, plus any other available metatdata:
            console.log(
              PREFIX+chalk.bold(friendlifiedExitName)
            );


            if (!_.isUndefined(report.responseHeaders['x-exit-description'])) {
              console.log(
                PREFIX + chalk.reset(report.responseHeaders['x-exit-description'])
              );
            }//>-

            if (!_.isUndefined(report.responseHeaders['x-exit-extended-description'])) {
              console.log(
                PREFIX + '\n'+
                PREFIX + chalk.reset(report.responseHeaders['x-exit-extended-description'])+'\n'+
                PREFIX
              );
            }//>-

            if (!_.isUndefined(report.responseHeaders['x-exit-more-info-url'])) {
              console.log(
                PREFIX + chalk.reset(report.responseHeaders['x-exit-more-info-url'])
              );
            }//>-

            if (!_.isUndefined(report.responseHeaders['x-exit-view-template-path'])) {
              console.log(
                PREFIX+ chalk.reset.bold('view: ') + chalk.dim.blue(report.responseHeaders['x-exit-view-template-path'])
              );
            }//>-

            // One last newline to make it easier to read.
            console.log(
              chalk.gray(' ° ')
            );

          }//>-

          // All done.

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
