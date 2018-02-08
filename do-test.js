'use strict';
var request = require('superagent');

// extend with Request#proxy()
require('superagent-proxy')(request);

// HTTP, HTTPS, or SOCKS proxy to use
var proxy = process.env.http_proxy || 'https://39.80.204.154:8118';

return request
  .get(process.argv[2] || 'https://encrypted.google.com/')
  .proxy(proxy)
  .end(onresponse);

function onresponse(err, res) {
  if (err) {
    console.log(err);
  } else {
    console.log(res.status, res.headers);
    console.log(res.body);
  }
}


const async = require('async');
let fs = require('fs');
let path = require('path');
let inputFile = process.argv && process.argv.length === 3 && process.argv[2];
let util = require('util');

if (!inputFile) {
  console.error('Input File is required');
  console.info('Usage: node http-proxy-test alexa-top-1m-bucket-1.csv');
  return;
}

let resultFileName = util.format('./category-results/result-%s.json', Date.now());
let alexa = path.join('./', inputFile);
let readStream = fs.createReadStream(path.join(__dirname, alexa));
let domainTasks = {};

var ProxyPool = require('./proxy-pool');
var proxies = require('./http-proxies');

var startDomain;
var canStart = false;

if (!startDomain) {
  canStart = true;
}

// ProxyPool = new ProxyPool(proxies.splice(0));


readDomains(readStream);

function doHttp(task, callback) {
  var requestFn = require('request');
  var Agent = require('socks5-https-client/lib/Agent');
  var activePool = ProxyPool.get();

  var requestUrl = util.format('https://categorify.org/api?website=%s', task && task.domain);

  return requestFn({
    url: requestUrl,
    strictSSL: true,
    agentClass: Agent,
    agentOptions: {
      socksHost: activePool.host,
      socksPort: activePool.port
    }
  }, function(err, resp, body) {
    if (body) {
      domainTasks[task.domain].domainCategory = body;
    }
    if (err) {
      console.log('Error', err, activePool.host, activePool.port);
      ProxyPool.markBusy(activePool);
      retryQueue(task.domain);
    }
    return callback();
  });
}

function readDomains(inputStream) {
  var maxDomains = 1500;
  var domains = [];
  inputStream.on('data', function onData(dataLines) {
    return dataLines && dataLines.toString().split('\n').reduce(function reduce(acc, lineItem) {
      if (!domainTasks[lineItem]) {
        var domainName = lineItem.substring(lineItem.indexOf(',') + 1);
        if (domains.length < maxDomains) {
          domains.push(doRequest(domainName, proxies[domains.length - 1]));
        }

      }
      return acc;
    }, undefined);
  });
  inputStream.on('end', function() {
    async.parallel(domains, function(err, result) {
      console.log(result);
    });

  });
}

function doRequest(domainName, proxy) {
  return function(callback) {
    if (!proxy) {
      return callback();
    }
    console.log('Has a Proxy');

    var requestFn = require('request');
    var proxyReq = requestFn.defaults({
      host: proxy.host,
      port: proxy.port
    });

    console.log(proxy.host, proxy.port);

    var requestUrl = util.format('https://categorify.org/');

    return proxyReq.get(requestUrl, function(err, resp, body) {
      console.log(err, body);
      return callback(undefined, body);
    });

    console.log('A Proxy', proxy);
    var Agent = require('socks5-https-client/lib/Agent');
    return requestFn({
      url: 'https://categorify.org',
      strictSSL: true,
      agentClass: Agent,
      agentOptions: {
        socksHost: proxy.host,
        socksPort: proxy.port
      }
    }, function(err, resp, body) {
      console.log(err, body);
      return callback(undefined, body);
    });

  }
}
