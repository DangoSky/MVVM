function Watcher(vm, attrVal, updateFn) {
  this.vm = vm;
  this.attrVal = attrVal;
  this.updateFn = updateFn;
  // 表示这个watcher(指令)涉及的dep(数据)，使用对象而不是数组是为了防止重复添加dep(每个dep都有自己的id)
  this.depIds = {};
  this.value = this.get();
}

Watcher.prototype = {
  get() {
    // 把Dep.target设置为当前的watcher，方便在observer里面将其添加到相关数据的dep中
    Dep.target = this;
    // parseVal只是为了触发指令对应的那些数据的get，从而把这个watcher添加到数据的dep中
    // 注意是那些数据，因为一个指令可能使用到了多个数据，比如a.b.c，这时watcher需要都添加到这三个dep中
    let value = this.parseVal(this, this.attrVal);
    Dep.target = null;
    return value;
  },
  
  // 获取指令对应的那个数据
  parseVal(test, attrVal) {
    let res = this.vm;
    let exps = attrVal.split('.');
    // 会调用到属性的get，从而将watcher添加到每个属性的dep中，例如a.b.c
    exps.forEach(key => {
      res = res[key];
    })
    return res;
  },

  // 此处涉及到Observer和Watcher的相互调用，原因是Observer中的每个dep的subs需要添加watcher，而watcher的depIds又需要添加dep
  // 为了将该dep和watcher能够传送到对方那里去，所以指令使用到数据时，先触发到Observer中数据对应的get方法，进而触发Watcher的addDep方法
  // 把dep传过来添加到watcher的depIds中，并把watcher传回去添加到dep的subs中
  addDep(dep) {
    // 如果该dep已经在watcher的depIds中，则不再重复添加
    if(!this.depIds.hasOwnProperty(dep.id)) {
      dep.addSub(this);
      this.depIds[dep.id] = dep;
    }
  },

  // watcher使用到的数据更新时，触发watcher的更新函数(在Observer触发update方法)
  update() {
    let curVal = this.get();
    let oldVal = this.value;
    if(curVal !== oldVal) {
      this.value = curVal;
      this.updateFn(curVal);
    }
  }
}