'use strict';
var request = require('request');
var proxyReq = request.defaults({
  host: "47.206.51.67",
  port: 8080
});

proxyReq.get('https://categorify.org', function(err, resp, body) {
  console.log(err, body);
});
