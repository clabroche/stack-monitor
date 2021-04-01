
function CustomObservable() {
  this.funcs = []
}
CustomObservable.prototype.subscribe = function (fun) {
  this.funcs.push(fun)
}
CustomObservable.prototype.next = function (...value) {
  this.funcs.forEach(f => f(...value))
}

export default CustomObservable