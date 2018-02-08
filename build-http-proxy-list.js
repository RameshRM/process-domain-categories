'use strict';

var fs = require('fs');
var proxyList = fs.readFileSync('./http-proxy.list').toString().split('\n');

proxyList = proxyList.map(function map(proxyEntry) {
  var proxyEntries = proxyEntry && proxyEntry.split('\t');

  if (Array.isArray(proxyEntries) && proxyEntries[6] === 'yes') {
    return {
      host: proxyEntries[0],
      port: proxyEntries[1]
    };
  } else {
    return;
  }
  return;
}).filter(function filter(item) {
  return item && item.host && item.host.length > 0;
});


fs.writeFileSync('http-proxies.json', JSON.stringify(proxyList.slice(0)));
