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
}, 20);
var start = Date.now();

readStream.on('data', function onData(dataLines) {
  return dataLines && dataLines.toString().split('\n').reduce(function reduce(acc, lineItem) {
    if (!domainTasks[lineItem]) {
      var domainName = lineItem.substring(lineItem.indexOf(',') + 1);
      domainTasks[domainName] = {
        domainCategory: undefined
      };

      q.push({
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

q.drain = function() {
  let domainKeys = Object.keys(domainTasks);

  domainKeys.reduce(function reduce(acc, item) {
    if (domainTasks[item].domainCategory) {
      var result = {};
      result[item] = domainTasks[item].domainCategory;
      writer.write(new Buffer(JSON.stringify(result)));

      delete domainTasks[item];
    }
  }, undefined);

  console.log('Drained', domainKeys.length);
};

function makeRequest(options, callback) {
  var requestUrl = util.format(baseUrl, options.domain);
  domainTasks[options.domain].domainCategory = {
    foo: 'bar'
  };
  return callback && callback(undefined, options);
  return request.get(requestUrl, function(result) {
    //   n.send(options.domain);
    domainTasks[options.domain] = options;
    return callback && callback(undefined, options);
  }).on('error', function(e) {
    domainTasks[options.domain] = options;
    return callback && callback(undefined, options);
  });
}
