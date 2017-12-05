/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');
var chalk = require('chalk');
var logRequestWare = require('./private/log-request.middleware');
var getHttpMethodColor = require('./private/get-http-method-color');
var getStatusCodeColor = require('./private/get-status-code-color');


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
          'GET r|^((?![^?]*\\/[^?\\/]+\\.[^?\\/]+(\\?.*)?).)*$|',
          // (^^Leave out assets)
          'POST /*',
          'PATCH /*',
          'PUT /*',
          'DELETE /*',
        ],

        dontLogParams: [
          'password',
          'token'
        ],

        onRequest: function (/*report, req, res*/) {
          // Defaults to doing nothing
        },

        // When response has finished...
        onResponse: function (report/*, req, res*/) {

          try {

            // The log function to use.
            // > FUTURE: This could be exposed in configuration, if someone has a good reason.
            var logFn = console.log;


            //  ╦  ╔═╗╔═╗  ╦  ╔═╗╔╗╔╔╦╗╔╦╗╔═╗╦═╗╦╔═   ┬┌─┐  ┌─┐┌─┐┌─┐┬─┐┌─┐┌─┐┬─┐┬┌─┐┌┬┐┌─┐
            //  ║  ║ ║║ ╦  ║  ╠═╣║║║ ║║║║║╠═╣╠╦╝╠╩╗   │├┤   ├─┤├─┘├─┘├┬┘│ │├─┘├┬┘│├─┤ │ ├┤
            //  ╩═╝╚═╝╚═╝  ╩═╝╩ ╩╝╚╝═╩╝╩ ╩╩ ╩╩╚═╩ ╩┘  ┴└    ┴ ┴┴  ┴  ┴└─└─┘┴  ┴└─┴┴ ┴ ┴ └─┘
            //
            // Now log a landmark message, if it seems a sensible time to do so.
            //
            // > This makes it easier to look at logs and get your bearings (plus it gives you a
            // > way to see _when_ things occured, in case you are not using a logging service like
            // > Papertrail that has built-in support for timestamps like Papertrail).
            //
            var now = Date.now();
            var MS_DEAD_AIR_BEFORE_NEW_LANDMARK = 30*1000;// 30 seconds
            var MS_DEAD_AIR_BEFORE_WRITING_OUT_ENTIRE_TIMESTAMP = 2*60*60*1000;// 2 hours
            var msSinceLastRequestReceived = now - sails.hooks.apianalytics._lastResponseFinishedAt;

            // If this is the first request in a long while, then log an ENTIRE timestamp.
            if (msSinceLastRequestReceived > MS_DEAD_AIR_BEFORE_WRITING_OUT_ENTIRE_TIMESTAMP) {

              logFn(
                '\n' +
                '\n' +
                '\n' +
                chalk.bold.underline(new Date(now)) + '\n' +
                '- - - - - - - - - - - - - - - - - - - - - - - - - - - - -' + '\n'
              );

            }
            // Check to see how long it's been since we finished handling the most recent request.
            // If it's been at least little while, log a landmark message, but do so in a more
            // approachable format.
            else if (msSinceLastRequestReceived > MS_DEAD_AIR_BEFORE_NEW_LANDMARK) {

              var relativeLandmarkMsg = (function(){

                var s = msSinceLastRequestReceived / 1000;
                var m = s / 60;
                var h = m / 60;

                if (Math.round(h) >= 2) {
                  return '~'+Math.round(h)+' hours later...';
                }
                else if (h >= 1 && Math.round(h) === 1) {
                  return 'About an hour later...';
                }
                else if (m >= 1 && Math.round(m) >= 2) {
                  return Math.round(m) + ' minutes later...';
                }
                else if (m >= 1 && Math.round(m) === 1) {
                  return 'About a minute later...';
                }
                else {
                  return Math.round(s) + ' seconds later...';
                }

              })();

              logFn(
                '\n' +
                '\n' +
                '\n' +
                chalk.bold.underline(relativeLandmarkMsg) + '\n'
              );

            }//>-


            // Now, before we continue, update the `_lastResponseFinishedAt` timestamp,
            // so that it's ready to go for next time.
            sails.hooks.apianalytics._lastResponseFinishedAt = now;



            //  ╔═╗╔═╗╦═╗╔╦╗╔═╗╔╦╗   ┬   ╦  ╔═╗╔═╗  ┬─┐┌─┐┌─┐ ┬ ┬┌─┐┌─┐┌┬┐  ┬─┐┌─┐┌─┐┌─┐┬─┐┌┬┐
            //  ╠╣ ║ ║╠╦╝║║║╠═╣ ║   ┌┼─  ║  ║ ║║ ╦  ├┬┘├┤ │─┼┐│ │├┤ └─┐ │   ├┬┘├┤ ├─┘│ │├┬┘ │
            //  ╚  ╚═╝╩╚═╩ ╩╩ ╩ ╩   └┘   ╩═╝╚═╝╚═╝  ┴└─└─┘└─┘└└─┘└─┘└─┘ ┴   ┴└─└─┘┴  └─┘┴└─ ┴
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
            var statusCodeBaseColor = getStatusCodeColor(report.statusCode);
            var displayStatusCode = chalk[statusCodeBaseColor](report.statusCode);

            // Make HTTP method (i.e. verb) and request URL path more attractive.
            var displayMethod = chalk[getHttpMethodColor(report.method)](report.method);
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
              displayIncomingArrow = chalk.dim.gray.bold(' -');
              displayMethod = chalk.dim(displayMethod);
              displayPath = chalk.dim(displayPath);
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


            // Build final, formatted output.
            var formattedOutput = util.format(
              '%s %s %s '+indentation+' %s',
              displayIncomingArrow,
              displayMethod,
              displayPath,
              chalk.gray('(')+displayMs+' '+displayStatusCode+chalk.gray(')')
            );

            // Now log it.
            logFn(formattedOutput);



            //  ╦  ╔═╗╔═╗  ╔═╗╔╦╗╔╦╗╦╔╦╗╦╔═╗╔╗╔╔═╗╦    ┬─┐┌─┐┌─┐  ┌┬┐┌─┐┌┬┐┌─┐┌┬┐┌─┐┌┬┐┌─┐
            //  ║  ║ ║║ ╦  ╠═╣ ║║ ║║║ ║ ║║ ║║║║╠═╣║    ├┬┘├┤ └─┐  │││├┤  │ ├─┤ ││├─┤ │ ├─┤
            //  ╩═╝╚═╝╚═╝  ╩ ╩═╩╝═╩╝╩ ╩ ╩╚═╝╝╚╝╩ ╩╩═╝  ┴└─└─┘└─┘  ┴ ┴└─┘ ┴ ┴ ┴─┴┘┴ ┴ ┴ ┴ ┴
            //  ┌─    ┌─┐┌─┐┌┬┐┬┌─┐┌┐┌┌─┐  ┌┬┐┬ ┬┌─┐  ┌─┐┌┐┌┬ ┬ ┬    ─┐
            //  │───  ├─┤│   │ ││ ││││└─┐───│ ││││ │  │ │││││ └┬┘  ───│
            //  └─    ┴ ┴└─┘ ┴ ┴└─┘┘└┘└─┘   ┴ └┴┘└─┘  └─┘┘└┘┴─┘┴     ─┘
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

              // (Skip logging the exit name itself if it is "success")
              if (report.responseHeaders['x-exit'] !== 'success') {
                logFn(
                  PREFIX+chalk[statusCodeBaseColor](friendlifiedExitName)
                );
              }//ﬁ

              if (!_.isUndefined(report.responseHeaders['x-exit-description'])) {
                logFn(
                  PREFIX + chalk.reset(report.responseHeaders['x-exit-description'])
                );
              }//>-

              if (!_.isUndefined(report.responseHeaders['x-exit-extended-description'])) {
                logFn(
                  PREFIX + '\n'+
                  PREFIX + chalk.reset(report.responseHeaders['x-exit-extended-description'])+'\n'+
                  PREFIX
                );
              }//>-

              if (!_.isUndefined(report.responseHeaders['x-exit-more-info-url'])) {
                logFn(
                  PREFIX + chalk.reset(report.responseHeaders['x-exit-more-info-url'])
                );
              }//>-

              if (!_.isUndefined(report.responseHeaders['x-exit-view-template-path'])) {
                logFn(
                  PREFIX+ chalk.reset('view: ') + chalk.dim.blue(report.responseHeaders['x-exit-view-template-path'])
                );
              }//>-

              // One last newline to make it easier to read.
              logFn(
                chalk.gray(' ° ')
              );

            }//>-

          } catch (e) {

            // If an unhandled error occurs, dump it to the terminal.
            // (but don't let it crash the process!)
            sails.log.error('Consistency violation: `sails-hook-apianalytics` encountered an unexpected error when attempting to log information about an incoming request.  Details:',e);
            return;

          }//>-•

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
      sails.log.info('Initializing `apianalytics` hook...  (requests to monitored routes will be logged!)');

      // Listen for when the router in Sails says it's time to bind "before" shadow routes:
      sails.on('router:before', function routerBefore() {

        _.each(sails.config.apianalytics.routesToLog, function iterator(routeAddress) {
          sails.router.bind(routeAddress, logRequestWare);
        });

      });//</bind router:before event>


      // Define a property we'll use to keep track of the last time
      // this hook finished handling a response (or in this case, when
      // this hook was initialized).  We use this to be able to write
      // date/time "landmarks" to the terminal.
      sails.hooks.apianalytics._lastResponseFinishedAt = Date.now();

      return next();

    }//</initialize>

  };
};
