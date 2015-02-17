/**
 * Module dependencies
 */

var _ = require('lodash');
var chalk = require('chalk');
var logRequestWare = require('./log-request.middleware');


/**
 * sails-hook-apianalytics
 */

module.exports = function sails_hook_apianalytics (sails) {
  return {

    defaults: {

      apianalytics: {

        // The types of requeests to log
        // (e.g. ["get /foo/bar", "post /foo", "/*"])
        // Defaults to all routes.
        routesToLog: [
          '/*'
        ],

        // Parameters which should NEVER be logged
        // (e.g. "password")
        // If seen, they will be replaced with "*PROTECTED*"
        dontLogParams: ['password', 'token'],

        // When request starts
        onRequest: function (inputs){
          // Defaults to doing nothing
        },

        // When request is done
        onResponse: function (inputs){

          var indentation = (function (){
            var numChars = inputs.method.length + inputs.path.length;

            var MARGIN = 40;

            if (MARGIN - numChars <= 0) {
              return '';
            }
            var indentation = '';
            for (var i=0;i<(MARGIN-numChars);i++) {
              indentation += ' ';
            }
            return indentation;
          })();

          // Make HTTP verb more attractive
          var displayVerb = chalk[getVerbColor(inputs.method)](inputs.method.toUpperCase());

          // Defaults to logging result w/ sails.log.verbose
          console.log(chalk.bold(chalk.gray('<-'))+' %s %s '+indentation+chalk.gray('(%sms)'), displayVerb,inputs.path,inputs.responseTime);
          if (!_.isUndefined(inputs.params)) {
            console.log('Params:',inputs.params);
          }
        }
      }
    },

    initialize: function(cb) {
      sails.log.verbose('Starting apianalytics hook- requests will be logged...');

      sails.config.apianalytics.routesToLog;

      sails.on('router:before', function (){
        _.each(sails.config.apianalytics.routesToLog, function (routeAddr){
          sails.router.bind(routeAddr, logRequestWare);
        });
      });
      cb();
    }

  };
};



function getVerbColor(_method){
  _method = _method.toUpperCase();
  switch (_method) {
    case 'GET': return 'green';
    case 'POST': return 'yellow';
    case 'PUT': return 'blue';
    case 'DELETE': return 'red';
    default: return 'gray';
  }
}
