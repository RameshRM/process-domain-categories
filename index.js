'use strict';

let async = require('async');
let util = require('util');
let fs = require('fs');
let path = require('path');
let request = require('https');
let cp = require('child_process');
let n = cp.fork(__dirname + '/write-result.js');
let writer = fs.createWriteStream('./fixtures/result.json');

let alexa = './fixtures/alexa-top-1m.csv';
let readStream = fs.createReadStream(path.join(__dirname, alexa));

let baseUrl = 'https://categorify.org/api?website=%s';
let domainTasks = {};

let q = async.queue(function(task, callback) {
  return makeRequest(task, callback);
  task && task.execTask(this, callback);
}, 10);

let cargoQueue = async.cargo(function(tasks, callback) {

  async.map(tasks, makeRequest.bind(this), function(err, result) {
    drain();
    return callback();
  });
}, 10);

// add some items
var start = Date.now();

readStream.on('data', function onData(dataLines) {
  return dataLines && dataLines.toString().split('\n').reduce(function reduce(acc, lineItem) {
    if (!domainTasks[lineItem]) {
      var domainName = lineItem.substring(lineItem.indexOf(',') + 1);
      domainTasks[domainName] = {
        domainCategory: undefined
      };

      cargoQueue.push({
        domain: domainName
      });
    }
    return acc;
  }, undefined);
});

readStream.on('end', function Complete() {
  writer.end();
  writer.close();
  console.log(util.format('Complete in %s ms', Date.now() - start));
  process.exit(1);
});

function drain() {
  let domainKeys = Object.keys(domainTasks);
  console.log('Start Drain');
  domainKeys.reduce(function reduce(acc, item) {
    if (domainTasks[item].domainCategory) {
      var result = {};
      result[item] = domainTasks[item].domainCategory;
      writer.write(new Buffer(util.format('%s\n', JSON.stringify(result))));

      delete domainTasks[item];
    }
  }, undefined);

  console.log('End Drain', domainKeys.length);
};

function makeRequest(options, callback) {
  var requestUrl = util.format(baseUrl, options.domain);
  console.log(options.domain);
  return request.get(requestUrl, function(result) {

    var dataParts = [];
    result.on('data', function(data) {
      dataParts.push(data.toString());
    });
    result.on('end', function(data) {
      domainTasks[options.domain].domainCategory = dataParts.join('');
      return callback && callback(undefined, options);
    });

  }).on('error', function(e) {
    return callback && callback(undefined, options);
  });
}
