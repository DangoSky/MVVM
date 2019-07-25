function MVVM(options) {
	// vue实例的data
	this._data = options.data;
	// vue实例的各个属性，data、method等
	this.options = options;
	// vue实例挂载的元素
	let el = options.el;
	this.proxyData(this._data);
	new Observer(this._data);
	new Compiler(el, this);
}

MVVM.prototype = {
	// 实现数据代理，使得之后要对vm._data中的属性进行操作时，直接操作vm就可以了，简便操作
	// 操作 vm.xxx -> vm._data.xxx
	proxyData(data) {
		let vm = this;
		Object.keys(data).forEach(key => {
			// 注意此处是劫持vm.xxx，而不是劫持vm._data.xxx，一开始vm.xxx值为undefined
			// 所以defineProperty的第一个参数是vm，而不是data
			// 如果是data的话在observer中调用defineReactive函数会循环调用到vm._data.xxx的get方法
			Object.defineProperty(vm, key, {
				enumerable: true,
				configurable: false,
				get() {
					return vm._data[key];
				},
				set(newVal) {
					vm._data[key] = newVal;
				}
			})
		})
	}
}