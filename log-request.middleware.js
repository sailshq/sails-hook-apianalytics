'use strict';

/**
 * Module dependencies
 */
var _ = require('lodash');

/**
 * Track an API request.
 */
module.exports = function logRequest(req, res, next) {
  // Get access to app instance
  var sails = req._sails;

  // Basic route information
  var log = {
    path: req.path,
    method: req.method,
    target: {
      action: req.options.action,
      controller: req.options.controller,
      model: req.options.model
    },
    protocol: req.protocol,
    ip: req.protocol == 'ws' ? req.socket.handshake.address : req.ip,
    allParams: _securityCleanse(req.params.all(), sails.config.apianalytics.dontLogParams),
    responseTime: 0,

    // The more technical stuff, for troubleshooting
    diagnostic: {
      url: req.url,
      transport: req.transport,
      options: req.options,
      queryParams: _securityCleanse(req.query, sails.config.apianalytics.dontLogParams),
      routeParams: _securityCleanse(req.params, sails.config.apianalytics.dontLogParams),
      bodyParams: _securityCleanse(req.body, sails.config.apianalytics.dontLogParams),
      middlewareLatency: _getMillisecondsElapsedSince(req._startTime)
    }
  };

  // Call log function
  if (_.isFunction(sails.config.apianalytics.onRequest)) {
    sails.config.apianalytics.onRequest(log, req, res);
  }

  // When the request is finished
  res.once('finish', function onceFinish() {
    // Track total response time
    log.responseTime = _getMillisecondsElapsedSince(req._startTime);

    // Check req.options for new values for 'action', 'controller' and 'model' values
    _.forEach(['action', 'controller', 'model'], function iterator(property) {
      log.target[property] = log.target[property] === req.options[property]
        ? log.target[property]
        : req.options[property]
      ;
    });

    // Save user session as embedded JSON to keep a permanent record
    log.userSession = _.cloneDeep(req.session);

    // Call log function
    if (_.isFunction(sails.config.apianalytics.onResponse)) {
      sails.config.apianalytics.onResponse(log, req, res);
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
 * Helper function to calculate how long current request take to process.
 *
 * @param  {Date}   startTime Request start time
 * @return {Number}           Total request elapsed time as in milliseconds
 * @private
 */
function _getMillisecondsElapsedSince(startTime) {
  return new Date() - startTime;
}

/**
 * Helper function to remove all 'secure' parameter values with *PROTECTED* string. By default this will replace
 * 'token' and 'password' property values, because there is security issue when logging these.
 *
 * @param   {{}|*}  collection  A "collection" to check for blacklisted propertied
 * @param   {[]}    properties  An array of properties to skip (replace actual value with *PROTECTED* string)
 * @returns {{}}
 * @private
 */
function _securityCleanse(collection, properties) {
  if (!_.isObject(collection)) {
    return collection;
  }

  var safeCopy = _.cloneDeep(collection);

  _.forEach(properties || [], function iterator(propName) {
    if (!_.isUndefined(safeCopy[propName])) {
      safeCopy[propName] = '*PROTECTED*';
    }
  });

  return safeCopy;
}
