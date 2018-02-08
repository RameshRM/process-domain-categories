'use strict';

var https = require('https');
var util = require('util');
var url = require('url');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

module.exports.execute = function(options, callback) {
  var HttpsProxyAgent = require('https-proxy-agent');

  var proxy = util.format('http://%s:%s', options.proxy.host, options.proxy.port);
  console.log('Proxy server %j', proxy);

  var endpoint = options.url;
  var httpOpts = url.parse(endpoint);

  // create an instance of the `HttpsProxyAgent` class with the proxy server information
  var agent = new HttpsProxyAgent(proxy);

  httpOpts.agent = agent;
  httpOpts.secureProxy = true;
  var hasCallBack = false;
  https.get(httpOpts, function(res) {
    var dataParts = [];

    res.on('error', function(error) {
      if (!hasCallBack) {
        hasCallBack = true;
        return callback(error);
      }

    });

    res.on('data', function(data) {
      dataParts.push(data.toString());
    });

    res.on('end', function() {
      return callback(undefined, dataParts.join(''));
    });

  }).on('error', function(e) {
    console.log(e);
    if (!hasCallBack) {
      hasCallBack = true;
      return callback(e);
    }
  });
};
