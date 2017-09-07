# sails-hook-apianalytics

A Sails hook for logging detailed request metadata and monitoring your API.

> This hook is for Sails v1 and up, and it also maintains backwards compatibility for Sails <=v0.12.  But be aware that it provides much richer default logging for requests handled via actions2 (which is only available in Sails v1).


## Install

From your sails app:

```bash
$ npm install sails-hook-apianalytics --save
```

That's it!  Next time you lift, and then send a request to the server, you should see stuff getting logged.

It will look something like this:

![screenshot of output](https://cloud.githubusercontent.com/assets/618009/20027313/a1a6abc0-a2de-11e6-985f-306b87aebc9c.png)


## Configuration

This hook works pretty well for most use cases out of the box.

Optionally, you can customize this hook in a few different ways by configuring `sails.config.apianalytics`.

For instance, you might create `config/apianalytics.js`:

```javascript
// `config/apianalytics.js`

module.exports = {

  apianalytics: {

    /**
     * An array of route addresses to monitor.
     *
     * (e.g. [ 'GET /foo/bar', 'POST /foo', 'all /admin/*' ])
     *
     * Defaults to logging all POST, PATCH, PUT, DELETE requests, and all
     * GET requests except for those that appear to be for assets
     * (i.e. using "GET r|^((?![^?]*\\/[^?\\/]+\\.[^?\\/]+(\\?.*)?).)*$|")
     */
    routesToLog: [
      // If you want to log everything- including requests for assets, use the following:
      '/*'
    ],

    /**
     * Request parameters which should NEVER be logged.
     * If seen, they will be replaced with "*REDACTED*"
     *
     * (e.g. "password")
     *
     * > WARNING:
     * > This is a SHALLOW check of request body, querystring, and route path parameters.
     * > Deeply nested properties with these names are not redacted.
     */
    dontLogParams: [
      'password',
      'token'
    ]
  }
};
```


## Help

If you have further questions or are having trouble, click [here](http://sailsjs.com/support).


## Bugs &nbsp; [![NPM version](https://badge.fury.io/js/sails-hook-apianalytics.svg)](http://npmjs.com/package/sails-hook-apianalytics)

To report a bug, [click here](http://sailsjs.com/bugs).


## Contributing

Please observe the guidelines and conventions laid out in the [Sails project contribution guide](http://sailsjs.com/documentation/contributing) when opening issues or submitting pull requests.

[![NPM info](https://nodei.co/npm/sails-hook-apianalytics.png?downloads=true)](http://npmjs.com/package/sails-hook-apianalytics)

## License

MIT &copy; 2013-2016 Mike McNeil

_As for the [Sails framework](http://sailsjs.com), it's free and open-source under the [MIT License](http://sailsjs.com/license) too._
