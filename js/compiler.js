function Compile() {

}

Compile.prototype = {
	// 解析节点
	compileElement(node) {
		let reg = /\{\}().*)\}\}/;
		let nodeVal = node.nodeValue;
		// 元素节点
		if(node.nodeType === 1) {
			this.compileDirective(node);
		}
		// 文本节点
		else if(node.nodeType === 3 && reg.test(nodeVal)) {
			// 获取第一个匹配到的字符串
			// 但还需要考虑有多个大括号的情况。如：{{nodeVal}}{{hello}}
			let value = RegExp.$1.trim();
			compileUtil.text();
		}
		// todo，放到第一个if前面。
		// 递归解析每一个子节点
		if(node.childrenNodes && node.childrenNodes.length) {
			this.compileElement();
		}
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
		
	},
	html() {

	},
	model() {

	}
}