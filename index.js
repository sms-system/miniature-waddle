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

      return new Promise(function (resolveFromPromise, rejectFromPromise) {
        resolveHandler = function (result) { resolveFromPromise(resolve(result)) }
        if (wasResolved) {
          if (resolvedValue instanceof Promise) {
            resolvedValue.then(function (res) { resolveHandler(res) })
          } else {
            resolveHandler(resolvedValue)
          }
        }
      })
    }

    var resolve = function (result) {
      if (wasResolved || wasRejected) { return }
      wasResolved = true
      resolvedValue = result
      if (resolveHandler) {
        if (result instanceof Promise) {
          result.then(function (res) { resolveHandler(res) })
        } else {
          resolveHandler(result)
        }
      }
    }

    var reject = function () {
      if (wasResolved || wasRejected) { return }
      wasRejected = true
    }

    try { fn(resolve, reject) }
    catch (err) { reject(err) }
  }

  Promise.resolve = function (value) {
    return new Promise(function (resolve) { resolve(value) })
  }

  return Promise
})()