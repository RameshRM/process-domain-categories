'use strict';

var DefinedPools = [{
  "host": "45.119.112.102",
  "port": "33211"
}, {
  "host": "103.90.200.2",
  "port": "35618"
}, {
  "host": "101.200.58.48",
  "port": "1080"
}, {
  "host": "138.210.198.106",
  "port": "17906"
}, {
  "host": "168.103.65.189",
  "port": "48000"
}];

module.exports = SocksPool;

function SocksPool(defaultPools) {
  this.availablePools = defaultPools;
  this.activePool;
  this.busyPools = [];
}

SocksPool.prototype.get = function() {
  if (!this.activePool) {
    this.activePool = this.availablePools.shift();
  }
  return this.activePool;
};

SocksPool.prototype.markBusy = function(busyPool) {

  if (busyPool) {
    this.busyPools.push(busyPool);
  }
  return this.activePool;
};
