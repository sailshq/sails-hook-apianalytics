# sails-hook-apianalytics

A Sails hook for logging detailed request metadata and monitoring your API.


## Install

From your sails app:

```bash
$ npm install sails-hook-apianalytics
```

That's it!  Next time you lift, you should see stuff getting logged.


## Configuration

Optionally, this hook can be configured.
This hook is configured under the `sails.config.apianalytics` namespace.

For instance, you might create `config/apianalytics.js`:

```javascript
// `config/apianalytics.js`

module.exports = {

  apianalytics: {

    /**
     * An array of route addresses to monitor.
     *
     * (e.g. [ 'get /foo/bar', 'post /foo', 'all /admin/*' ])
     *
     * Defaults to `[ '/*' ]`.
     */
    routesToLog: [
      '/*'
    ],

    /**
     * Request parameters which should NEVER be logged.
     * (e.g. "password")
     * If seen, they will be replaced with "*PROTECTED*"
     */
    dontLogParams: ['password', 'token'],

    /**
     * When request starts...
     *
     * > If omitted, this defaults to doing nothing.
     *
     * @param {Ref} log  [logger (CaptainsLog instance)]
     * @param {Ref} req  [request object -- careful not to modify!]
     * @param {Ref} res  [response object -- careful not to modify!  And don't try to respond!]
     * @synchronous
     */
    onRequest: function onRequest(log, req, res) {

      // ...

      return;
    },

    /**
     * When response is sent...
     *
     * > If omitted, this defaults to logging request metadata to the
     * > console in a vaguely attractive way.
     *
     * @param {Ref} log  [logger (CaptainsLog instance)]
     * @param {Ref} req  [request object -- careful not to modify!]
     * @param {Ref} res  [response object -- careful not to modify!  And don't try to respond!]
     * @synchronous
     */
    onResponse: function onResponse(log, req, res) {

      // ...

      return;
    }
  }
};
```


## Help

If you have further questions or are having trouble, click [here](http://sailsjs.com/support).


## Bugs &nbsp; [![NPM version](https://badge.fury.io/js/sails-hook-apianalytics.svg)](http://npmjs.com/package/sails-hook-apianalytics)

To report a bug, [click here](http://sailsjs.com/bugs).


## Contributing

Please observe the guidelines and conventions laid out in the [Sails project contribution guide](http://sailsjs.com/contribute) when opening issues or submitting pull requests.

[![NPM info](https://nodei.co/npm/sails-hook-apianalytics.png?downloads=true)](http://npmjs.com/package/sails-hook-apianalytics)

## License

MIT &copy; 2013-2016 Mike McNeil

_As for the [Sails framework](http://sailsjs.com), it's free and open-source under the [MIT License](http://sailsjs.com/license) too._
