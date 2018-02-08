'use strict';

const fs = require('fs');
const cluster = require('cluster');
const path = require('path');
const util = require('util');
const CategorifyReader = require('./read-categorify').Reader;

let inputFile = process.argv && process.argv.length === 3 && process.argv[2];

let startDomain = 'astronomie.de';
let canStart = !startDomain ? true : false;

if (cluster.isMaster) {

  const numCPUs = require('os').cpus().length;
  let alexa = path.join('./', inputFile);
  let readStream = fs.createReadStream(path.join(__dirname, alexa));

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  for (const id in cluster.workers) {
    // cluster.workers[id].send(require('./socks-proxies'));
    cluster.workers[id].on('message', function() {
      console.log('Message');
    });
  }

  let buckets = [];
  readDomains(readStream, cluster.workers);

} else {
  let Reader = new CategorifyReader();
  process.on('message', function(message) {
    Reader.read(message && message.split('\n'));
  });

}

function FooBar() {
  this.foo = "Foo" + Date.now();
}



function readDomains(inputStream, workers) {
  let domains = {};
  let maxKeys = 0;
  let threshold = 200;

  function sendMessage(message) {
    var worker = workers[getRandomIdx(4)];
    if (worker) {
      worker.send(message);
    }
  }

  inputStream.on('data', function onData(dataLines) {
    return dataLines && dataLines.toString().split('\n').reduce(function reduce(acc, lineItem) {
      var domainName = lineItem.substring(lineItem.indexOf(',') + 1);
      if (domainName === startDomain && !canStart) {
        canStart = true;
      }

      if (canStart) {

        if (maxKeys < threshold) {
          domains[domainName] = 1;
          maxKeys++;
        }

        if (maxKeys === threshold) {
          domains = drain(domains);
        }

      }
      return acc;
    }, undefined);
  });

  inputStream.on('end', function() {
    domains = drain(domains);
  });

  function drain(inputDomains) {
    maxKeys = 0;
    if (inputDomains) {
      sendMessage(Object.keys(inputDomains).join('\n'));
    }
    return {};
  }
}

function getRandomIdx(max) {
  return Math.floor((Math.random() * max) + 1);
}


function doHttp(task) {
  return function(callback) {
    var request = require('request');
    var activePool = ProxyPool.get();
    var proxyReq = request.defaults({
      host: activePool.host,
      port: activePool.port
    });
    console.log(activePool.host, activePool.port);
    var requestUrl = util.format('https://categorify.org/api?website=%s', task && task.domain);

    return proxyReq.get(requestUrl, function(err, resp, body) {
      console.log(body, err);
      if (body) {
        domainTasks[task.domain].domainCategory = body;
      }

      if (err) {
        console.log(err, activePool.host, activePool.port);
        ProxyPool.markBusy(activePool);
        retryQueue(task.domain);
      }

      return callback();
    });

  };
}
