'use strict';

let fs = require('fs');
let writer = fs.createWriteStream('./fixtures/result.ndjson');
let util = require('util');

process.on('message', function(message) {
  if (message === 'end') {
    return writer.end(function() {
      console.log('Complete')
    });
  }
  writer.write(util.format('%s\n', message));
});
