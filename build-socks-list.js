'use strict';

var fs = require('fs');
var socksList = fs.readFileSync('./socks.list').toString().split('\n');

socksList = socksList.map(function map(sock) {
  var sockEntry = sock.substring(0, sock.indexOf('#'));
  return {
    host: sockEntry.substring(0, sockEntry.indexOf(':')),
    port: sockEntry.substring(sockEntry.indexOf(':') + 1)
  };
});


fs.writeFileSync('socks-list.json', JSON.stringify(socksList.slice(0)));
