'use strict'

var PPromise = (function () {
  var Promise = function (fn) {
    if (!(this instanceof Promise)) {
      throw new Error('Missed "new" operator')
    }
    if (typeof fn !== 'function') {
      throw new Error('Promise argument must be a function')
    }

    var wasResolved = false, wasRejected = false
    var resolveHandler, rejecteHandler
    var resolvedValue

    this.then = function (resolve, reject) {
      if (typeof resolve !== 'function') {
        resolve = function () { return resolvedValue }
      }

      resolveHandler = resolve
      rejecteHandler = reject

      if (wasResolved) {
        return resolve(resolvedValue)
      }
    }

    var resolve = function (result) {
      if (wasResolved || wasRejected) { return }
      wasResolved = true
      if (resolveHandler) { resolveHandler(result) }
    }

    var reject = function () {
      if (wasResolved || wasRejected) { return }
      wasRejected = true
    }

    try {
      fn(resolve, reject)
    } catch (err) {
      reject(err)
    }
  }

  return Promise
})()
