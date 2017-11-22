/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');

/**
 * redactProtectedKeys()
 *
 * Loop over the provided dictionary and build a deep clone where keys that match
 * anything on the blacklist have had their RHS values replaced with "*REDACTED*" (like
 * literally with that string.)  This is useful for scrubbing things like password` or
 * `illness` for security and/or compliance reasons.
 *
 * > Note that if the provided value is not a dictionary, this bails silently
 * > (^^this is just for backwards compat.)
 * >
 * > Same thing if no blacklist is provided (bail silently)-- except this is for a
 * > good reason--  b/c there's nothing to do.
 * >
 * > Also note that this is a shallow cleanse-- deep properties are not checked!
 *
 *
 * @param   {Dictionary}  dictionary
 *          A dictionary (plain JavaScript object) to check for blacklisted properties.
 *
 * @param   {Array}  blacklist
 *          The array of keys to watch out for (e.g. `['password', 'illness', 'ccNumber']`)
 *
 * @returns {Dictionary}
 */

module.exports = function redactProtectedKeys(dictionary, blacklist) {

  if (!_.isObject(dictionary)) {
    return dictionary;
  }

  if (_.isUndefined(blacklist)) {
    return dictionary;
  }
  else if (!_.isArray(blacklist)) {
    throw new Error('Consistency violation: Unexpected bad usage in cleanseDictionary.  Expected blacklist to be an array of strings, but got: '+util.inspect(blacklist,{depth:null}));
  }//>-•


  // Get deep clone of dictionary.
  var cleansedCopy = _.cloneDeep(dictionary);

  // Loop over each top-level property and redact any that are protected.
  _.each(blacklist, function (protectedPropName) {

    if (!_.isUndefined(cleansedCopy[protectedPropName])) {
      cleansedCopy[protectedPropName] = '*REDACTED*';
    }

  });//</_.each>

  return cleansedCopy;
};
