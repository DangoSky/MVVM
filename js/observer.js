function Observer {

}

Observer.prototype = {
	// 数据劫持
	defineReactive(obj, key, value) {
		Object.defineProperty(obj, key, {
			get(value) {
				return value;
			},
			set(newVal) {

			}
		})
	}

}