function MVVM(options) {
	let data = options.data;
	let el = options.el;
	let fragment = nodeToFragment(document.getElementById(el));

	// 为什么要实现数据代理

	
}

function nodeToFragment(node) {
	let fragment = document.createDocumentFragment();
	let child;
	// 使用appendChid方法将原dom树中的节点添加到DocumentFragment中时，会删除掉原来dom树中的节点
	while(child = node.firstChild) {
		fragment.appendChild(child);
	}
	return fragment;
}