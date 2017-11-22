/**
 * Helper function to get the appropriate chalk color for the specified status code.
 *
 * @param   {Number}  statusCode
 * @returns {String}
 *
 * @private
 */

module.exports = function getStatusCodeColor(statusCode) {

  statusCode = +statusCode;

  if (statusCode >= 200 && statusCode < 300) {
    return 'green';
  }
  else if (statusCode >= 300 && statusCode < 400) {
    return 'white';
  }
  else if (statusCode >= 400 && statusCode < 500) {
    return 'yellow';
  }
  else {
    return 'red';
  }

};
