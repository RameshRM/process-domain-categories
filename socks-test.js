'use strict';

var fs = require('fs');
var SocksPool = require('./proxy-pool');
var SocksList = require('./http-proxies');
var util = require('util');

SocksPool = new SocksPool(require('./http-proxies').splice(0, 3));
var socksInfo = SocksList[random(1, SocksList.length)]


// console.log(socksInfo);

const async = require('async');
let q = async.queue(function(task, callback) {
  return doHttpSocks(task, callback);
}, 1);
q.drain = function() {
  console.log('Drain');
};

async.map(SocksList, testSocks5.bind(this), function(err, result) {

});

function random(low, high) {
  return Math.ceil(Math.random() * (high - low) + low);
}


function testSocks5(socksItem) {
  return q.push(socksItem);
}

function doHttpSocks(socksItem, callback) {
  // var Agent = require('socks5-https-client/lib/Agent');
  var request = require('request');
  var proxyReq = request.defaults({
    host: socksItem.host,
    port: socksItem.port
  });

  return request.get('https://categorify.org/', function(err, resp, body) {
    console.log(body, err);
    return callback();
  });

  return request({
    url: 'https://categorify.org/',
    strictSSL: true,
    agentClass: Agent,
    agentOptions: {
      socksHost: socksItem.host,
      socksPort: socksItem.port
    },
    timeout: 2000
  }, function(err, res) {
    if (err) {
      erroredSocks({
        err: err,
        socks5: socksItem
      });
    }
    if (res) {
      successfulSocks(socksItem);
    }
    return callback();
  });

}

function erroredSocks(socksItem) {
  fs.appendFileSync('socks-error.ndjson', util.format('%s\n', JSON.stringify(socksItem)));
}

function successfulSocks(socksItem) {
  fs.appendFileSync('socks-successful.ndjson', util.format('%s\n', JSON.stringify(socksItem)));
}
