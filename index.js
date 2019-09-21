'use strict'

var PPromise = (function () {
  var STATES = { PENDING: 0, RESOLVED: 1, REJECTED: 2 }

  function onResolve (promise, onSuccess, onError) {
    promise.then(onSuccess, onError)
  }

  function isPromise (val) {
    return val instanceof Promise
  }

  var Promise = function (fn) {
    if (!(this instanceof Promise)) {
      throw new Error('Missed "new" operator')
    }
    if (typeof fn !== 'function') {
      throw new Error('Promise argument must be a function')
    }

    var state = STATES.PENDING, value
    var resolveHandler, rejectHandler

    this.then = function (thenResolver, thenRejector) {
      if (typeof thenResolver !== 'function') {
        thenResolver = function () { return value }
      }

      return new Promise(function (resolve, reject) {
        resolveHandler = function (result) {
          try {
            var thenResult = thenResolver(result)
            resolve(thenResult)
          } catch (error) {
            reject(error)
          }
        }
        rejectHandler = function (result) {
          if (typeof thenRejector !== 'function') { reject(result) }
          else { resolve(thenRejector(result)) }
        }

        if (state === STATES.RESOLVED) {
          if (isPromise(value)) { onResolve(value, resolveHandler, rejectHandler) }
          else { resolveHandler(value) }
        }
        if (state === STATES.REJECTED) { rejectHandler(value) }
      })
    }

    this.catch = function (thenRejector) { return this.then(null, thenRejector) }

    var resolve = function (result) {
      if (state !== STATES.PENDING) { return }
      state = STATES.RESOLVED
      value = result
      if (resolveHandler) {
        if (isPromise(result)) { onResolve(result, resolveHandler, rejectHandler) }
        else { resolveHandler(result) }
      }
    }

    var reject = function (error) {
      if (state !== STATES.PENDING) { return }
      state = STATES.REJECTED
      value = error
      if (rejectHandler) { rejectHandler(error) }
    }

    try { fn(resolve, reject) }
    catch (err) { reject(err) }
  }

  Promise.resolve = function (value) {
    return new Promise(function (resolve) { resolve(value) })
  }

  Promise.reject = function (value) {
    return new Promise(function (_, reject) { reject(value) })
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = Promise
  }

  return Promise
})()