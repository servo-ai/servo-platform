function Deferred() {
  let p = this.promise = new Promise((resolve, reject) => {
    this.resolve = resolve;
    this.reject = reject;
  });
  this.then = this.promise.then.bind(p);
  this.catch = this.promise.catch.bind(p);
}

module.exports = Deferred;
