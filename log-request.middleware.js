/**
 * Module dependencies
 */

var _ = require('lodash');




/**
 * Track an API request.
 */

module.exports = function logRequest (req, res, next) {

  // Get access to app instance
  var sails = req._sails;

  // Basic route information
  var activity = {
    path: req.path,
    method: req.method,
    target: req.target || { action: '', controller: ''},
    allParams: _securityCleanse(req.params.all(), sails.config.apianalytics.dontLogParams),
    responseTime: null,

    // The more technical stuff, for troubleshooting
    diagnostic: {
      url: req.url,
      transport: req.transport,
      queryParams: _securityCleanse(req.query, sails.config.apianalytics.dontLogParams),
      routeParams: _securityCleanse(req.params, sails.config.apianalytics.dontLogParams),
      bodyParams: _securityCleanse(req.body, sails.config.apianalytics.dontLogParams),
      middlewareLatency: _getMilisecondsElapsedSince( req._startTime )
    }
  };

  // Call log function
  if (_.isFunction(sails.config.apianalytics.onRequest)) {
    sails.config.apianalytics.onRequest(activity);
  }


  // When the request is finished
  res.once('finish', function () {

    // Track total response time
    activity.responseTime = _getMilisecondsElapsedSince( req._startTime );

    // Save user session as embedded JSON to keep a permanent record
    activity.userSession = _.cloneDeep(req.session);

    // Call log function
    if (_.isFunction(sails.config.apianalytics.onResponse)) {
      sails.config.apianalytics.onResponse(activity);
    }

    // Replaced this w/ custom log fns
    //////////////////////////////////////////////////////////////////////
    // Persist activity to database
    // LoggedRequest.create(activity).exec(function (err, activity) {
    //   if (err) {
    //     sails.log.error('Error logging API activity to database:');
    //     sails.log.error(err);
    //     return;
    //   }

    //   // Log result
    //   sails.log.verbose();
    //   sails.log.verbose(activity.method,activity.path, '(',activity.responseTime+'ms',')');
    //   sails.log.verbose('Params:',activity.params);

    // });
    //////////////////////////////////////////////////////////////////////

  });

  // Pass control on to app
  return next();
};



/**
 * [_getMilisecondsElapsedSince description]
 * @param  {[type]} startTime [description]
 * @return {[type]}           [description]
 */
function _getMilisecondsElapsedSince (startTime) {
  return new Date() - startTime;
}




/**
 * Prevents access tokens+passwords sent as params
 * from being logged
 */
function _securityCleanse ( collection, propsToSkip ) {

  if ( !_.isObject(collection) ) {
    return collection;
  }
  var safeCopy = _.cloneDeep(collection);

  _.each(propsToSkip||[],function (propName){
    if (!_.isUndefined(safeCopy[propName])){
      safeCopy[propName] = '*PROTECTED*';
    }
  });

  return safeCopy;
}
