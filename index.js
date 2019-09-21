'use strict'

var PPromise = (function () {
  var STATES = { PENDING: 0, RESOLVED: 1, REJECTED: 2 }

  function onResolve (promise, onSuccess, onError) {
    promise.then(onSuccess, onError)
  }

  function isPromise (val) {
    return val instanceof Promise
  }

  function onFullfilled (fn) {
    return function (val) {
      setTimeout(function () { fn(val) }, 0)
    }
  }

  function resolveAll (deferredHandlers, result, currentInstance) {
    var isItPromise = isPromise(result)
    while (deferredHandlers.length) {
      var deferred = deferredHandlers.shift()
      if (isItPromise) {
        if (result === currentInstance) {
          deferred.reject(new TypeError('Chaining cycle detected'))
        } else {
          onResolve(result, deferred.resolve, deferred.reject)
        }
      } else {
        deferred.resolve(result)
      }
    }
  }

  function rejectAll (deferredHandlers, result) {
    while (deferredHandlers.length) {
      var deferred = deferredHandlers.shift()
      deferred.reject(result)
    }
  }

  var Promise = function (fn) {
    if (!(this instanceof Promise)) {
      throw new Error('Missed "new" operator')
    }
    if (typeof fn !== 'function') {
      throw new Error('Promise argument must be a function')
    }

    var state = STATES.PENDING, value
    var deferredHandlers = []
    var self = this

    this.then = function (thenResolver, thenRejector) {
      if (typeof thenResolver !== 'function') {
        thenResolver = function () { return value }
      }

      return new Promise(function (resolve, reject) {
        deferredHandlers.push({
          resolve: onFullfilled(function (result) {
            try {
              var thenResult = thenResolver(result)
              resolve(thenResult)
            } catch (error) {
              reject(error)
            }
          }),
          reject: onFullfilled(function (result) {
            try {
              if (typeof thenRejector !== 'function') { reject(result) }
              else { resolve(thenRejector(result)) }
            } catch (error) {
              reject(error)
            }
          })
        })

        if (state === STATES.RESOLVED) {
          resolveAll(deferredHandlers, value, self)
        }

        else if (state === STATES.REJECTED) {
          rejectAll(deferredHandlers, value)
        }
      })
    }

    this.catch = function (thenRejector) { return this.then(null, thenRejector) }

    var resolve = onFullfilled(function (result) {
      if (state !== STATES.PENDING) { return }
      state = STATES.RESOLVED
      value = result
      resolveAll(deferredHandlers, result, self)
    })

    var reject = onFullfilled(function (error) {
      if (state !== STATES.PENDING) { return }
      state = STATES.REJECTED
      value = error
      rejectAll(deferredHandlers, error)
    })

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