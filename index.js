'use strict';

(function(global) {
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

  function resoveThenable (args) {
    var self = args.self
    var then = args.then
    var thenable = args.thenable
    var deferred = args.deferred
    var isFullfilled = false
    try {
      then.call(
        thenable,
        function (value) {
          if (isFullfilled) { return }
          isFullfilled = true
          var thenable = getThenable(value)
          applyResolver (deferred, thenable, value, self)
        },
        function (value) {
          if (isFullfilled) { return }
          isFullfilled = true
          deferred.reject(value)
        }
      )
    } catch (err) {
      if (isFullfilled) { return }
      isFullfilled = true
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
          deferred: deferred
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

    var thenWithOpt = function (thenResolver, thenRejector, throwErrors) {
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
              if (throwErrors) { throw error }
            }
          }),
          reject: onNextTick(function (result) {
            try {
              if (typeof thenRejector !== 'function') { reject(result) }
              else { resolve(thenRejector(result)) }
            } catch (error) {
              reject(error)
              if (throwErrors) { throw error }
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

    this.then = function (onSuccess, onError) { return thenWithOpt(onSuccess, onError) }

    this.catch = function (thenRejector) { return this.then(null, thenRejector) }

    this.finally = function (callback) {
      var handler = function (correctlyResolved) {
        return function (value) {
          try { callback() }
          catch (err) { throw err }
          if (correctlyResolved) { return value }
          else { throw value }
        }
      }
      return this.then(handler(true), handler(false))
    }

    this.done = function (onSuccess, onError) {
      thenWithOpt(function (value) {
        if (typeof onSuccess === 'function') {
          onSuccess(value)
        }
      }, function (error) {
        if (typeof onError === 'function') {
          onError(error)
        } else {
          throw error
        }
      }, true)
    }

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

  Promise.prototype.toString = function () {
    return '[object Promise]'
  }

  Promise.all = function (array) {
    function resolveFromQueue (resolved, value, queue, resolver) {
      resolved.push(value)
      if (resolved.length === queue.length) {
        resolver(resolved)
      }
    }

    return new Promise(function(resolve, reject) {
      var resolved = []
      for (var i = 0; i < array.length; i++) {
        var thenable = getThenable(array[i])
        if (thenable.isThenable) {
          array[i].then(function (result) {
            resolveFromQueue (resolved, result, array, resolve)
          }, function (err) { reject(err) })
        } else {
          resolveFromQueue (resolved, array[i], array, resolve)
        }
      }
    })
  }

  Promise.race = function (array) {
    return new Promise(function(resolve, reject) {
      for (var i = 0; i < array.length; i++) {
        var thenable = getThenable(array[i])
        if (thenable.isThenable) { array[i].then(resolve, reject) }
        else { resolve(array[i]) }
      }
    })
  }

  if (typeof global === 'object' && typeof global.exports === 'object' && global) {
    global.exports = Promise
  } else {
    global.PPromise = Promise
    try {
      if (
        global.Promise &&
        getThenable(new global.Promise(function () {})).isThenable
      ) { return }
    }
    catch (err) { }
    global.Promise = Promise
  }
})(
  (typeof module === 'object' && typeof module.exports === 'object' && module) ||
  (typeof window === 'object' && window.window === window && window) ||
  this
)
