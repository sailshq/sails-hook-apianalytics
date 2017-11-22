/**
 * Helper function to get the appropriate chalk color for the specified HTTP method (aka verb).
 *
 * @param   {String}  method
 * @returns {String}
 *
 * @private
 */

module.exports = function getHttpMethodColor(method) {

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
