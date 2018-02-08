'use strict';

var proxies = require('./http-proxies-2');
var async = require('async');
var util = require('util');

var counter = 0;
async.mapLimit(proxies, 10, doRequest.bind(this), function(err, result) {
  var returnResult = {
    total: result && result.length,
    successCount: result && result.filter(function(item) {
      return item && item.status === 'ok'
    }).length,
    errorCount: result && result.filter(function(item) {
      return item && item.status === 'err'
    }).length,
    result: result
  };
  require('fs').writeFileSync('proxy-results.json', JSON.stringify(returnResult));
});


function doRequest(proxy, callback) {
  var start = Date.now();
  if (proxy.port === 8080) {
    return callback(undefined, {});
  }
  var request = require('request');
  var proxyReq = request.defaults({
    host: proxy.host,
    port: proxy.port
  });

  return proxyReq.get('https://categorify.org', {
    timeout: 50000
  }, function(err, resp, body) {
    var result = {
      proxy: proxy,
      curl: util.format('curl -x https://%s:%s https://categorify.org', proxy.host, proxy.port)
    };
    result.timeTaken = Date.now() - start;
    if (!err) {
      counter++;
      console.log(err, result && result.statusCode, Date.now() - start);
      result.status = 'ok';
    } else {
      console.log('Err', Date.now() - start);
      result.status = 'err';
    }
    return (callback(undefined, result));
  });

}


// doRequest();
