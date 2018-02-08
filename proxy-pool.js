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

ProxyPool.prototype.getNext = function() {
  
  if (!this.activePool) {
    this.availablePools = this.availablePools.concat(this.busyPools);
    this.activePool = this.availablePools.shift();
  }
  this.busyPools.push(this.activePool);
  return this.activePool;
};

ProxyPool.prototype.getRandom = function() {
  var randomNumber = randomInt(0, this.availablePools.length);

  return this.availablePools[randomNumber];

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

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}
