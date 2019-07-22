function Compile(el) {
	// 确保el是DOM节点
	this.el = this.isElementNode(el) ? el : document.querySelector(el);
	if(this.el) {
		// 将DOM节点转换为文档树，防止后续频繁操作DOM影响性能
		this.fragment = this.nodeToFragment(this.el);
		this.compileElement(this.fragment);
	}
}

Compile.prototype = {
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
	compileElement(node) {
		let childNodes = node.childNodes;
		let reg = /\{\}().*)\}\}/;		// 匹配大括号
		[].slice.call(childNodes).forEach(child => {
			let value = child.nodeValue;
			// 元素节点
			if(child.nodeType === 1) {
				this.compileDirective(child);
			}
			// 文本节点
			else if(child.nodeType === 3 && reg.test(value)) {
				// RegExp.$1获取第一个匹配到的字符串
				// 但还需要考虑有多个大括号的情况。如：{{nodeVal}}{{hello}}
				// {{}}和v-text是同一样的处理
				compileUtil.text(child, RegExp.$1.trim());
			}
			// todo，放到第一个if前面。
			// 递归解析每一个子节点
			if(child.childrenNodes && child.childrenNodes.length) {
				this.compileElement(child);
			}
		})
	},

	// 解析指令
	compileDirective(node) {
		let nodeAttrs = node.attributes;
		Array.prototype.slice.call(nodeAttrs).forEach((attr) => {
			let attrName = attr.name;
			if(judgeDirective(atttName)) {
				let attrVal = attr.value;
				let dirName = attrName.substring(2);
				// v-on事件指令
				if(dirName.indexOf('on') === 0) {
					this.handleEvent(); 
				}
				// 非事件指令
				else {

				}
			}
			
		})
	},

	// 判断元素节点的属性是否为指令
	judgeDirective(attr) {
		return attr.indexOf('v-') === 0;
	},

	//
	handleEvent() {
		console.log("handle event");
	}
};

// 处理各个指令
let compileUtil = {
	text(node, attrVal) {
		this.bind(node, attrVal, 'text');
	},
	html() {

	},
	model() {

	},
	bind(node, attrVal, dirName) {
		let updateFn = updater[dirName + 'Updater'];
		updateFn && updateFn(node, attrVal);
	}
}

// 针对不同的指令进行不同的更新操作
let updater = {
	textUpdater(node, attrVal) {
		node.textContent = attrVal;
	}
}