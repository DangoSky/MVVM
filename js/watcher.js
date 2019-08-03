function Watcher(vm, attrVal, callback) {
  this.vm = vm;

  this.callback = callback;
  this.depIds = {};

  this.value = this.get();
}

Watcher.prototype = {
  get() {
    Dep.target = this;
  }
}