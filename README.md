# Vue双向数据绑定原理

## 实现思路

Vue 通过数据劫持来实现数据绑定，使用 [Object.defineProperty()](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) 来劫持各个数据的 get 和 set 方法。当使用到某一个数据时会触发该数据的 get 方法，所以我们可以在 get 方法中将使用到该数据的指令收集起来（这些就是该数据的依赖）；当修改到这个数据的值时会触发该数据的 set 方法，我们再在 set 方法中去逐个触发这些依赖的更新函数，从而就可以达到 model / view 双向更新的效果。

理解了实现思路后，我们再从这个思路出发，想想实现过程中会遇到什么问题：

- 在 get 方法中如何收集依赖？依赖具体是指什么？要收集在哪里？

  - **依赖是什么：** 比如 ` <input type="text v-model="inputVal">`，inputVal 是 mvvm 实例中的一个 data 数据，而这个 input 输入框的 v-model 指令使用到了它。所以这个输入框就成了 inputVal 的依赖，当 inputVal 的值改变时，这个依赖也要随着做出相应的改变。因为可能会有多个元素节点多条指令使用到同一个数据，所以数据的依赖是会有多个的。

  - **如何收集：** 是否是某个数据的依赖取决于这个元素节点有没有使用到某个数据，可能是通过 `v-` 指令，也可能是通过 `{{}}`。所以就需要我们去遍历整个 `Dom` 树，判断每一个元素节点 / 文本节点上是否有使用到相关的指令，以及指令上使用到了什么数据。这也就是 `compiler.js` 的工作——解析各个节点上的指令，并根据不同的指令使用、绑定不同的更新方法。

  - **收集在哪里：** 顾名思义，依赖是依赖于数据而言的，所以我们可以为每一个数据建立一个对象，用一个独一无二的 id 来表示这个数据，用一个 subs 属性（数组）来存放该数据的所有依赖。这就是 observer.js 中 `Dep` 构造器。

## 代码结构

```
MVVM
|—— index.html 入口文件
|—— js
|   |—— mvvm.js      构造 MVVM，实现数据代理
|   |—— observer.js  进行数据劫持，构造 Dep 来收集依赖
|   |—— compiler.js  解析、处理指令
|   |—— watcher.js   订阅相关属性的变化并更新视图
```

## 预期实现

- [x] 可以解析 `v-model` 指令进行双向数据绑定。
- [x] view / model 改变时，model / view 自动进行更新。
- [x] 可以解析一些简单的指令：`{{}}`, `v-text`, `v-class`, `v-html`, `v-on`。

## 实现步骤

### 构建 MVVM

刚开始写一个 mvvm 的时候会有些无法从下手的感觉，因为看到的都是 observer、compiler 和 watcher。虽然这些是 mvvm 的重要组成部分，也是 Vue 双向数据绑定原理的精髓，但并不是 mvvm 的入口。如果一开始就从 observer 等写起的话，很可能会陷入不知道怎么写、接下来不知道写什么的局面。所以我们需要先把 mvvm 建立好，有了地基后才好有方向指引我们接下来要写什么。

我们可以模仿 Vue 那样，先创建一个 MVVM 实例。

```js
index.html

let vm = new MVVM({
  el: '#app',
  data: {},
  method: {}
}
```

有了一个 mvvm 实例，我们才可以往里面定义各个 data 属性和 method 函数，像使用 Vue 那样去构建我们的项目。为了能够正常使用这个 vm 实例，我们需要先定义 MVVM 构造器。

```js
function MVVM(options) {
	// vue实例的data
	this._data = options.data;
	// vue实例的各个属性，data、method等
	this.options = options;
	// vue实例挂载的元素
	let el = options.el;
}
```

到这里一个基本的空架子就有了，接下来我们就需要按照先前的实现思路一步步在上面添砖加瓦。不过为了后续操作 data 的方便，我们可以先实现数据代理。先解释一下什么是数据代理吧，比如我们可以通过 a 来操作 c，但由于这种方法比较麻烦，所以我们通过 b 来操作 c，而 b 在这里就是起到了代理的作用。回到 mvvm，我们每次要使用到 data 中的数据时，都得通过 vm._data.xxx 来获取数据，所以我们可以使用 vm 来代理 vm._data，之后我们只需要通过 vm.xxx 就能获取到 vm._data.xxx 了。可能当前这个数据代理的好处不是很明显，但在后续的 observer.js 等文件中操作 data 时就会很方便了。具体的实现也是利用 `Object.defineProperty()` 改写 get 和 set 方法，当读写 vm.xxx 时，操作 vm._data.xxx 就可以了。

### 指令解析

我们暂时先不去写数据劫持的代码，因为涉及到了 Dep 和 Watcher。我们可以先写指令解析和相关的更新操作，把页面渲染出来先。

在解析指令时，因为会频繁操作到 DOM，所以为了提高性能，我们先创建文档片段，在这个文档片段上进行 DOM 操作后再将其插入回 DOM 中。

```js
nodeToFragment(node) {
  let fragment = document.createDocumentFragment();
  let child;
  while(child = node.firstChild) {
    fragment.appendChild(child);
  }
  return fragment;
}
```

此处的 node 是指我们挂载 MVVM 实例的元素节点，也就是我们初始化时绑定的 el。可能会有人不理解这个 while 循环（包括我），`while(child = node.firstChild)` 不是一直将 el 的第一个子节点赋值给 child 吗？不会导致死循环吗？这个问题的关键在于，使用 appendChid 方法将原 DOM 树中的节点添加到 DocumentFragment 中时，会同时删除掉原来 DOM 树中的节点！所以当把 el 的所有子节点都添加到文档片段中时，自然也就结束循环了。

有了 el 的文档片段后，我们就可以遍历上面的每一个节点了。此处还要区分节点的类型，HTML 的节点有分为元素节点、文本节点和注释节点等。我们需要通过 [nodeType]( MDN ) 对元素节点和文本节点都进行判断，

1.  对于元素节点，我们要遍历节点上的每一个属性，若存在指令（以 ‘v-' 开头的属性），则根据不同的指令名进行相应的处理，比如 v-text 指令就进行节点文本替换，v-class 指令则增加节点的 class，v-on 指令就给节点绑定相关的监听函数。

2.  而对于文本节点，我们只需要去匹配它的文本是否具有 {{}}，有的话则将文本内容替换成相应的 data 属性的数据。

这里有几个需要注意的点：

- 遍历节点时，需要递归遍历每一个节点。

- 对于 {{}} 和 v-text 指令，需要考虑到有嵌套对象的情况，比如 a.b.c，要一步步从 data 解析下去获取相应的属性值。

完成到这一步后，我们已经能够使用 MVVM 的指令和数据成功渲染出一个页面了，只不过现在的页面还是静态的，还差最最关键的数据绑定部分。

### 数据劫持
























## 参考资料：
- [尚硅谷_Vue核心技术](https://www.bilibili.com/video/av24099073/?p=49)
- [mvvm](https://github.com/DMQ/mvvm)

