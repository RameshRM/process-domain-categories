'use strict';

var DefinedPools = require('./http-proxies');

module.exports = ProxyPool;

function ProxyPool(defaultPools) {
  this.availablePools = defaultPools;
  this.activePool;
  this.busyPools = [];
}

ProxyPool.prototype.get = function() {
  if (!this.activePool) {
    this.availablePools = this.availablePools.concat(this.busyPools);
    this.activePool = this.availablePools.shift();
  }
  return this.activePool;
};

ProxyPool.prototype.markBusy = function(busyPool) {

  if (busyPool) {
    this.busyPools.push(busyPool);
  }
  this.activePool = undefined;
  return this.activePool;
};
