var NodeCache = require('node-cache');
var dblogger = require('utils/dblogger');

/**
 *  static factory
 */
class CacheFactory {

  /**
   * main factory megthod
   * @param {*} options 
   * @param {*} cacheName 
   */
  static createCache(options, cacheName = "node-cache") {

    switch (cacheName) {

      case "node-cache":

        return new NodeCacheWrapper(options);
        break;
      default:
        dblogger.error('non recognized cache name')
    }
  }
}

/**
 * INTERFACE definition
 */
class Cache {
  get(key) {
    throw 'not implemented cache';
  }

  set(key, value) {
    throw 'not implemented cache';
  }

  flushAll() {
    throw 'not implemented cache';
  }

  del(key) {
    throw 'not implemented cache';
  }

  keys(cb) {
    throw 'not implemented cache';
  }

  getStats() {
    throw 'not implemented cache';
  }
}

/**
 * node-cache wrapper
 */
class NodeCacheWrapper extends Cache {

  constructor(options) {
    super();
    options = options || {
      stdTTL: 0
    };
    this.nodeCache = new NodeCache(options);
  }

  objToString(obj) {
    return JSON.stringify(obj);
  }

  get(key) {
    if (typeof key !== "string" && typeof key !== "number") {
      key = this.objToString(key);
    }
    return this.nodeCache.get(key);
  }

  set(key, value) {
    return this.nodeCache.set(key, value);
  }

  flushAll() {
    return this.nodeCache.flushAll();
  }

  del(key) {
    return this.nodeCache.del(key);
  }

  keys(cb) {
    return this.nodeCache.keys(cb);
  }

  getStats() {
    return new Promise((resolve, reject) => {
      resolve(this.nodeCache.getStats());
    });

  }

  getObject() {
    return this.nodeCache.mget(this.keys());
  }
}

module.exports = CacheFactory;
