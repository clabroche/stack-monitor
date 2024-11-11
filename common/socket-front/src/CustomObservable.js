function CustomObservable() {
  /** @type {GenericFunction[]} */
  this.funcs = [];
}
/** @param {GenericFunction} fun */
CustomObservable.prototype.subscribe = function (fun) {
  this.funcs.push(fun);
  return {
    unsubscribe: () => this.unsubscribe(fun),
  };
};

/** @param {any[]} value */
CustomObservable.prototype.next = function (...value) {
  this.funcs.forEach((f) => f(...value));
};

/** @param {GenericFunction} fun */
CustomObservable.prototype.unsubscribe = function (fun) {
  this.funcs = [...this.funcs.filter((f) => f !== fun)];
};

export default CustomObservable;

/**
 * @typedef {(...args: any[]) => any} GenericFunction
 */
