function Compiler(el, vm) {
	this.vm = vm;
	// 确保el是DOM节点
	this.el = el.nodeType === 1 ? el : document.querySelector(el);
	if(this.el) {
		// 将DOM节点转换为文档树，防止后续频繁操作DOM影响性能
		this.fragment = this.nodeToFragment(this.el);
		this.compileElement(this.fragment, this.vm);
		// 把文档树挂载回DOM树
		this.el.appendChild(this.fragment);
	}
}

Compiler.prototype = {
  nodeToFragment(node) {
		let fragment = document.createDocumentFragment();
		let child;
		// 使用appendChid方法将原dom树中的节点添加到DocumentFragment中时，会删除掉原来dom树中的节点
		while(child = node.firstChild) {
			fragment.appendChild(child);
		}
		return fragment;
	},

	// 解析节点
	compileElement(node, vm) {
		let childNodes = node.childNodes;
		let reg = /\{\{(.*)\}\}/;		// 匹配大括号
		// 遍历所有子节点
		[].slice.call(childNodes).forEach(child => {
			let value = child.textContent;
			// 元素节点
			if(child.nodeType === 1) {
				this.compileDirective(child, vm);
			}
			// 文本节点
			else if(child.nodeType === 3 && reg.test(value)) {
				// RegExp.$1获取第一个匹配到的字符串
				// {{}}和v-text是同一样的处理
				compileUtil.text(child, vm, RegExp.$1.trim());
			}
			// 递归解析每一个子节点
			if(child.childNodes && child.childNodes.length) {
				this.compileElement(child, vm);
			}
		})
	},

	// 解析指令
	compileDirective(node, vm) {
		let nodeAttrs = node.attributes;
		// 遍历元素节点上的所有属性
		Array.prototype.slice.call(nodeAttrs).forEach((attr) => {
			let attrName = attr.name;
			if(this.judgeDirective(attrName)) {
				let dirName = attrName.substring(2);
				let attrVal = attr.value;
				// v-on事件指令
				if(dirName.indexOf('on') === 0) {
					this.handleEvent(node, vm, attrVal, dirName); 
				}
				// 非事件指令,v-model、v-text等
				else {
					compileUtil[dirName] && compileUtil[dirName](node, vm, attrVal);
				}
				// 指令解析完毕后移除指令属性
				node.removeAttribute(attrName);
			}
		})
	},

	// 判断元素节点的属性是否为指令
	judgeDirective(attr) {
		return attr.indexOf('v-') === 0;
	},

	// 处理事件指令
	handleEvent(node, vm, fnName, dirName) {
		let eventName = dirName.split(":")[1];
		let fn = vm.options.method && vm.options.method[fnName];
		// 给该元素绑定相应的事件处理函数
		if(eventName && fn) {
			node.addEventListener(eventName, fn.bind(vm));
		}
	}
};

// 处理各个指令
let compileUtil = {
	text(node, vm, attrVal) {
		this.bind(node, vm, attrVal, 'text');
	},
	html(node, vm, attrVal) {
		this.bind(node, vm, attrVal, 'html');
	},
	class(node, vm, attrVal) {
		this.bind(node, vm, attrVal, 'class');
	},
	model(node, vm, attrVal) {
		this.bind(node, vm, attrVal, 'model');
		let curVal = this.getTextVal(vm, attrVal);
		// 监听input，变化的时候就随之改变vm中相应的数据
		node.addEventListener('input', (e) => {
			let newVal = e.target.value;
			if(newVal === curVal)  return;
			let res = vm;
			let targetData = attrVal.split('.');
			targetData.forEach((key, index) => {
				// 不能直接res=res[key]取到最终的data属性，若res直接取到最终属性对应的值(string类型)，修改的时候不会改变到vm里相应的属性值
				if(index < targetData.length - 1) {
					res = res[key];
				}
				else {
					res[key] = newVal;
				}
			})
			curVal = newVal;
		})
	},
	bind(node, vm, attrVal, dirName) {
		let updateFn = updater[dirName + 'Updater'];
		let val = this.getTextVal(vm, attrVal);
		updateFn && updateFn(node, val);
		
		// 每个指令对应一个watcher，当表达式中对应的值改变时触发watcher的回调函数来更新视图
		new Watcher(vm, attrVal, function(curVal) {
			updateFn && updateFn(node, curVal);
		})
	},
	// 考虑到{{}}或v-text中有a.b.c这种嵌套的对象，所以需要一步步解析下去取值
	getTextVal(vm, attrVal) {
		let res = vm;
		attrVal = attrVal.split('.');
		attrVal.forEach(key => {
			res = res[key];
		})
		return res;
	}
}

// 针对不同的指令进行不同的更新操作，更新视图
let updater = {
	textUpdater(node, attrVal) {
		node.textContent = attrVal;
	},
	modelUpdater(node, attrVal) {
		node.value = attrVal;
	},
	classUpdater(node, attrVal) {
		let className = node.className;
		// 如果该元素已经设置有class，则多个class之间需要以空格间隔开
		let haveSpace = (className && attrVal) ? ' ' : '';
		node.className = className + haveSpace + attrVal;
	},
	htmlUpdater(node, attrVal) {
		node.innerHTML = attrVal;
	}
}