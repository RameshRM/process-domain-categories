'use strict';

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
var proxies = require('./socks-proxies');
var startDomain;
var canStart = false;

if (!startDomain) {
  canStart = true;
}

ProxyPool = new ProxyPool(proxies.splice(0));

let q = async.cargo(function(tasks, callback) {
  async.map(tasks, doHttp.bind(this), function(err, result) {
    drain();
    setTimeout(callback, 1000);
  });
}, 10);

function drain() {
  console.log('Drain');
  let domainKeys = Object.keys(domainTasks);
  domainKeys.reduce(function reduce(acc, item) {
    if (domainTasks[item].domainCategory) {
      var result = {};
      result[item] = domainTasks[item].domainCategory;
      writeToFile(JSON.stringify(result));
      delete domainTasks[item];
    }
  }, undefined);
};

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
  inputStream.on('data', function onData(dataLines) {
    return dataLines && dataLines.toString().split('\n').reduce(function reduce(acc, lineItem) {
      if (!domainTasks[lineItem]) {
        var domainName = lineItem.substring(lineItem.indexOf(',') + 1);

        if (domainName === startDomain && !canStart) {
          canStart = true;
        }

        if (canStart) {
          domainTasks[domainName] = {
            domainCategory: undefined
          };
          q.push({
            domain: domainName
          });

        }
      }
      return acc;
    }, undefined);
  });
}


function writeToFile(input) {
  fs.appendFileSync(resultFileName, util.format('%s\n', input));
}

function retryQueue(domain) {
  q.push({
    domain: domain
  });
}
