function CustomObservable() {
  /** @type {GenericFunction[]} */
  this.funcs = [];
}
/** @param {GenericFunction} fun */
CustomObservable.prototype.subscribe = function (fun) {
  this.funcs.push(fun);
};

/** @param {any[]} value */
CustomObservable.prototype.next = function (...value) {
  this.funcs.forEach((f) => f(...value));
};

CustomObservable.prototype.off = function (fun) {
  this.funcs = this.funcs.filter((f) => f !== fun);
};

CustomObservable.prototype.destroy = function () {
  this.funcs = [];
};

module.exports = CustomObservable;

/**
 * @typedef {(...args: any[]) => any} GenericFunction
 */
