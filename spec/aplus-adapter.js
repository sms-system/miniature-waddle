const Promise = require('../index')

exports.fulfilled = Promise.resolve
exports.rejected = Promise.reject
exports.deferred = function () {
  const obj = {}
  obj.promise = new Promise(function(resolve, reject) {
    obj.resolve = resolve
    obj.reject = reject
  })
  return obj
}