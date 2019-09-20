'use strict'

var PPromise = (function () {
  var Promise = function (fn) {
    if (!(this instanceof Promise)) {
      throw new Error('Missed "new" operator')
    }
    if (typeof fn !== 'function') {
      throw new Error('Promise argument must be a function')
    }
  }

  Promise.prototype.then = function (fn) {
    console.log('THEN')
  }

  return Promise
})()
