/**
 * Helper function to get current HTTP verb color definition for default logger.
 *
 * @param   {string}  method
 * @returns {string}
 * @private
 */
module.exports = function getVerbColor(method) {

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

};
