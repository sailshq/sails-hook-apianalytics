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
      return 'cyan';
    case 'POST':
      return 'yellow';
    case 'PUT':
      return 'yellow';
    case 'DELETE':
      return 'yellow';
    case 'PATCH':
      return 'yellow';

    default:
      return 'white';
  }

};
