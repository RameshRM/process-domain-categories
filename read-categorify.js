'use strict';

const async = require('async');
const util = require('util');
const fs = require('fs');

const ProxyPoolFn = require('./proxy-pool');
const MAX_TIMEOUT = 10000;

let resultFileName = util.format('./category-results/bucket2/result-%s.json', Date.now());
let ProxyPool = new ProxyPoolFn(require('./http-proxies').splice(0));
let q;
let domainTasks = {};

let httpClient = require('./http-proxy-client');

module.exports.Reader = Reader;

function Reader() {
  q = async.cargo(function(tasks, callback) {
    async.parallelLimit(tasks, 10, function(err, result) {
      drain();
      setTimeout(callback, 200);
    });
  }, 5);
}

Reader.prototype.read = function read(inputDomains) {
  let self = this;
  inputDomains && inputDomains.reduce(function reduce(acc, domain) {
    domainTasks[domain] = {
      domainCategory: undefined
    };
    q.push(doHttp({
      domain: domain
    }));
    return acc;
  }, undefined);
};

function drain() {
  if (!domainTasks) {
    return;
  }
  let domainKeys = Object.keys(domainTasks);
  console.log('Drain Completed Tasks ', domainKeys.length);

  domainKeys.reduce(function reduce(acc, item) {
    if (domainTasks[item].domainCategory) {
      var result = {};
      result[item] = domainTasks[item].domainCategory;
      writeToFile(JSON.stringify(result));
      delete domainTasks[item];
    }
  }, undefined);
};


function doHttp(task) {
  return function(callback) {
    if (!task || !task.domain || !domainTasks[task.domain]) {
      return callback();
    }
    var request = require('request');
    var activePool = ProxyPool.get();
    var proxyReq = request.defaults({
      host: activePool.host,
      port: activePool.port
    });
    var requestUrl = util.format('https://categorify.org/api?website=%s', task && task.domain);

    return httpClient.execute({
      url: requestUrl,
      proxy: activePool
    }, function(err, result) {
      if (err) {
        ProxyPool.markBusy(activePool);
        retryQueue(task.domain);
      }
      domainTasks[task.domain].domainCategory = result;

      return callback();
    });

  };
}

function retryQueue(domain) {
  q.push({
    domain: domain
  });
}

function writeToFile(input) {
  fs.appendFileSync(resultFileName, util.format('%s\n', input));
}
