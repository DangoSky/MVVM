function Observer(data) {
	this.data = data;
	this.walk();
}

Observer.prototype = {
	// 给data里的每一项数据都进行数据劫持
	walk() {
		Object.keys(this.data).forEach((key) => {
			this.defineReactive(this.data, key, this.data[key]);
		})
	},
	
	// 数据劫持
	defineReactive(data, key, curVal) {
		Object.defineProperty(data, key, {
			enumerable: true,
			configurable: false,
			get() {
				return curVal;
			},
			set(newVal) {
				if(newVal === curVal) {
					return;
				}
				curVal = newVal;
			}
		})
	}

}