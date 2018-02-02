'use strict';

let async = require('async');
let util = require('util');
let fs = require('fs');
let path = require('path');
let request = require('superagent');
let cp = require('child_process');
let n = cp.fork(__dirname + '/write-result.js');
let writer = fs.createWriteStream('./fixtures/result.json');
let alexa = './fixtures/alexa-top-1m.csv';
let readStream = fs.createReadStream(path.join(__dirname, alexa));

let baseUrl = 'https://categorify.org/api?website=%s';
let domainTasks = {};

let cargoQueue = async.cargo(function(tasks, callback) {
  async.map(tasks, makeRequest.bind(this), function(err, result) {
    drain();
    setTimeout(callback, 2000);
  });
}, 10);

// add some items
var start = Date.now();
var canStart = false;
var startDomain = 'wespeke.com';
readStream.on('data', function onData(dataLines) {
  return dataLines && dataLines.toString().split('\n').reduce(function reduce(acc, lineItem) {
    if (!domainTasks[lineItem]) {
      var domainName = lineItem.substring(lineItem.indexOf(',') + 1);
      domainTasks[domainName] = {
        domainCategory: undefined
      };
      if (domainName === startDomain && !canStart) {
        canStart = true;
      }

      if (canStart === true) {
        cargoQueue.push({
          domain: domainName
        });
      }
    }
    return acc;
  }, undefined);
});

readStream.on('end', function Complete() {
  //writer.end();
  //writer.close();
  console.log(util.format('Complete in %s ms', Date.now() - start));
  // process.exit(1);
});

function writeToFile(input) {
  fs.appendFileSync('./fixtures/category-results-3.json', util.format('%s\n', input));
}

function drain() {
  let domainKeys = Object.keys(domainTasks);
  console.log('Start Drain', cargoQueue._tasks.length);

  domainKeys.reduce(function reduce(acc, item) {
    if (domainTasks[item].domainCategory) {
      var result = {};
      result[item] = domainTasks[item].domainCategory;
      // writer.write(new Buffer(util.format('%s\n', JSON.stringify(result))));
      writeToFile(JSON.stringify(result));

      delete domainTasks[item];
    }
  }, undefined);

  // console.log('End Drain', domainKeys.length);
};

function makeRequest(options, callback) {
  var requestUrl = util.format(baseUrl, options.domain);
  console.log(requestUrl);

  request.get(requestUrl).timeout({
    response: 3000
  }).end(function(err, result) {
    if (result && result.text) {
      domainTasks[options.domain].domainCategory = result.text;
    }
    if (err) {
      console.log(err);
    }
    return callback(undefined, options);

  });

}
