function MVVM(options) {
	let data = options.data;
	let el = options.el;

	new Observer(data);
	new Compiler(el);

	// 为什么要实现数据代理


}