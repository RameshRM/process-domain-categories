'use strict';

var fs = require('fs');
var proxyList = fs.readFileSync('./http-proxy.list').toString().split('\n');

proxyList = proxyList.map(function map(sock) {
  var sockEntry = sock.substring(0);
  return {
    host: sockEntry.substring(0, sockEntry.indexOf(':')),
    port: sockEntry.substring(sockEntry.indexOf(':') + 1)
  };
}).filter(function filter(item) {
  return item.host && item.host.length > 0;
});


fs.writeFileSync('http-proxies.json', JSON.stringify(proxyList.slice(0)));
