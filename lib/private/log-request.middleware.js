/**
 * Module dependencies
 */

var _ = require('@sailshq/lodash');
var redactProtectedKeys = require('./redact-protected-keys');


/**
 * Track an API request.
 */

module.exports = function logRequest(req, res, next) {

  // Get access to app instance
  var sails = req._sails;

  // Basic route information
  var report = {

    path: req.path,
    method: req.method,

    allParams: redactProtectedKeys(req.allParams(), sails.config.apianalytics.dontLogParams),

    protocol: req.protocol,

    ip: req.protocol === 'ws' ? req.socket.handshake.address : req.ip,

    target: {
      action: req.options.action,
      controller: req.options.controller,
      model: req.options.model,
      view: req.options.view
    },

    // The more technical stuff, for troubleshooting
    diagnostic: {
      url: req.url,
      transport: req.transport,
      options: req.options,
      queryParams: redactProtectedKeys(req.query, sails.config.apianalytics.dontLogParams),
      routeParams: redactProtectedKeys(req.params, sails.config.apianalytics.dontLogParams),
      bodyParams: redactProtectedKeys(req.body, sails.config.apianalytics.dontLogParams)
    }

  };//</build initial report>

  // Track when this was received.
  var receivedAt = Date.now();

  // If `req._startTime` exists and is valid, then compute and include `middlewareLatency` in our report.
  // (Otherwise don't include middlewareLatency, since it'd be meaningless.)
  if (_.isNumber(req._startTime)) {
    report.diagnostic.middlewareLatency = receivedAt - req._startTime;
  }//>-


  // Call `onRequest` function
  if (_.isFunction(sails.config.apianalytics.onRequest)) {
    sails.config.apianalytics.onRequest(report, req, res);
  }//>-


  // Now bind a one-time listener that will fire when the request is finished.
  res.once('finish', function onceFinish() {

    // Track when the response finished.
    var finishedAt = Date.now();

    // Compute and track total response time
    // (ms since request was received here and when the response finished, + any middleware latency, if known)
    report.responseTime = (
      (finishedAt - receivedAt) +
      (report.diagnostic.middlewareLatency||0)
    );

    // Check req.options for new values for 'action' and 'controller' values,
    // _since they might have changed programmatically_ since we first tracked them.
    _.each(['action', 'controller', 'model', 'view'], function iterator(property) {

      // If not already equivalent, set `target.whatever` in our report to be
      // equal to `req.options.whatever`.
      if (report.target[property] !== req.options[property]) {
        report.target[property] = req.options[property];
      }

    });

    // Add response status code to the report.
    report.statusCode = +res.statusCode;

    // Add response headers to the report.
    // (note that this is not a documented thing and should not be relied upon!!!!)
    report.responseHeaders = res._headers;

    // Save user session as embedded JSON to keep a permanent record
    report.userSession = _.cloneDeep(req.session);

    // Call log function
    if (_.isFunction(sails.config.apianalytics.onResponse)) {
      sails.config.apianalytics.onResponse(report, req, res);
    }

  });//</bind one-time listener for `finish` event :: i.e. res.once()>


  // Pass control on to app
  return next();

};

