function Observer(data) {

}

Observer.prototype = {
	// 给data里的每一项数据都进行数据劫持
	walk(data) {
		Object.keys(data).forEach((key) => {
			this.defineReactive(data, key, data[key]);
		})
	},

	// 数据劫持
	defineReactive(obj, key, value) {
		Object.defineProperty(obj, key, {
			enumerable: true,
			// configurable: false,
			get() {
				// return value;
			},
			set(newVal) {
				if(newVal === value) {
					return;
				}
				value = newVal;
			}
		})
	}

}