'use strict';

let fs = require('fs');
let path = require('path');
let alexa = './fixtures/alexa-top-1m.csv';
let util = require('util');
let readStream = fs.createReadStream(path.join(__dirname, alexa));
let bucketCounter = 0;
let lineCounter = 0;
let max = 300000;
let bucketLines = [];

readStream.on('data', function onData(dataLines) {
  return dataLines && dataLines.toString().split('\n').reduce(function reduce(acc, lineItem) {
    var domainName = lineItem.substring(lineItem.indexOf(',') + 1);
    if (bucketLines.length > 0 && lineCounter % max === 0) {
      bucketCounter++;
      writeToFile(util.format('./alexa-top-1m-bucket-%s.csv', bucketCounter), bucketLines.join('\n'));
      bucketLines = [];
    }
    lineCounter++;
    bucketLines.push(domainName);
    return acc;
  }, undefined);

});
readStream.on('end', function() {
  if (bucketLines.length > 0) {
    bucketCounter++;
    writeToFile(util.format('./alexa-top-1m-bucket-%s.csv', bucketCounter), bucketLines.join('\n'));
  }
});

function writeToFile(fileName, data) {
  fs.writeFileSync(fileName, data);
}
