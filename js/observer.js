function Observer(data) {
	this.data = data;
	this.walk(this.data);
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
		console.log(1);
		Object.defineProperty(obj, key, {
			enumerable: true,
			configurable: false,
			get() {
				// return value;
				return value;
			},
			set(newVal) {
				if(newVal === value) {
					return;
				}
				// value = newVal;
				obj[key] = newVal;
			}
		})
	}

}