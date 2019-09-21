'use strict'

var PPromise = (function () {
  var STATES = { PENDING: 0, RESOLVED: 1, REJECTED: 2 }

  function getThenable (val) {
    if (
      (typeof val !== 'object' && typeof val !== 'function') ||
      val === null
    ) {
      return { isThenable: false }
    }
    try {
      var then = val.then
      return typeof then === 'function' ?
        { isThenable: true, value: then } :
        { isThenable: false }
    } catch (err) {
      return {
        value: err,
        isThenable: true,
        isError: true
      }
    }
  }

  function onNextTick (fn) {
    return function (val) {
      setTimeout(function () { fn(val) }, 0)
    }
  }

  function resoveThenable ({ self, then, thenable, deferred }) {
    try {
      then.call(
        thenable,
        function (value) {
          var thenable = getThenable(value)
          applyResolver (deferred, thenable, value, self)
        },
        deferred.reject
      )
    } catch (err) {
      deferred.reject(err)
    }
  }

  function applyResolver (deferred, thenable, result, currentInstance) {
    if (thenable.isThenable) {
      if (result === currentInstance) {
        deferred.reject(new TypeError('Chaining cycle detected'))
      } else if (thenable.isError) {
        deferred.reject(thenable.value)
      } else {
        resoveThenable({
          self: currentInstance,
          then: thenable.value,
          thenable: result,
          deferred
        })
      }
    } else {
      deferred.resolve(result)
    }
  }

  function resolveAll (deferredHandlers, result, currentInstance) {
    var thenable = getThenable(result)
    while (deferredHandlers.length) {
      var deferred = deferredHandlers.shift()
      applyResolver(deferred, thenable, result, currentInstance)
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
      throw new TypeError('Missed "new" operator')
    }
    if (typeof fn !== 'function') {
      throw new TypeError('Promise resolver is not a function')
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
          resolve: onNextTick(function (result) {
            try {
              var thenResult = thenResolver(result)
              resolve(thenResult)
            } catch (error) {
              reject(error)
            }
          }),
          reject: onNextTick(function (result) {
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

    var resolve = onNextTick(function (result) {
      if (state !== STATES.PENDING) { return }
      state = STATES.RESOLVED
      value = result
      resolveAll(deferredHandlers, result, self)
    })

    var reject = onNextTick(function (error) {
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