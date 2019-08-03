function Observer(data) {
	if(!data || typeof data !== 'object') {
		return;
	}
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
		// 每一个数据都对应着一个dep
		let dep = new Dep();
		// 递归劫持该对象里面的每一个属性（针对属性值是对象的时候）
		new Observer(curVal);

		Object.defineProperty(data, key, {
			enumerable: true,
			configurable: false,
			get() {
				if(Dep.target) {

				}
				return curVal;
			},
			set(newVal) {
				if(newVal === curVal) {
					return;
				}
				curVal = newVal;
				// 监听newVal（针对newVal是对象的时候）
				new Observer(newVal);
				// 通知相关的订阅者
				dep.notify();
			}
		})
	}

}

let ID_NUM = 0;	 // 标志每个watcher的ID，ID是为了防止重复添加watcher
// 收集各个依赖
function Dep() {
	this.id = ID_NUM++;
	this.subs = [];  // 数组元素是各个watcher
}

Dep.prototype = {
	addSub(sub) {
		this.subs.push(sub);
	},

	removeSub(sub) {
		let index = this.subs.indexOf(sub);
		if(index !== -1) {
			this.subs.splice(index, 1);
		}
	},

	// 数据改变了，通知它的各个订阅者去更新
	notify() {
		this.subs.forEach(sub => {
			sub.update();
		})
	}
}