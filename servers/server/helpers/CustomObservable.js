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

module.exports = CustomObservable;

/**
 * @typedef {(...args: any[]) => any} GenericFunction
 */
