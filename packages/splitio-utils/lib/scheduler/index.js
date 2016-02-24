'use strict';

function SchedulerFactory() {
  var timeoutID = undefined;

  return {
    forever: function forever(fn /*: function */, delay /*: number */) /*:? Array<any> */ /*: Promise */{
      for (var _len = arguments.length, fnArgs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        fnArgs[_key - 2] = arguments[_key];
      }

      var _this = this;

      var firstRunReturnPromise = fn.apply(undefined, fnArgs);

      timeoutID = setTimeout(function () {
        _this.forever.apply(_this, [fn, delay].concat(fnArgs));
      }, delay);

      return firstRunReturnPromise;
    },
    kill: function kill() {
      clearTimeout(timeoutID);
      timeoutID = undefined;
    }
  };
}

module.exports = SchedulerFactory;
//# sourceMappingURL=index.js.map