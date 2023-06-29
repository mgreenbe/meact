import { render, h, Component, Fragment } from "/src/index.js";

console.log("~~~~~~\nPreact\n~~~~~~");
const parentDom = document.getElementById("preact-parent-dom");

// const objDefaults = {
// 	addedNodes: new Set([]),
// 	removedNodes: new Set([]),
// 	oldValue: null,
// 	attributeName: null,
// };

// const observeConfig = {
// 	characterData: true,
// 	characterDataOldValue: true,
// 	attributes: true,
// 	childList: true,
// 	attributeOldValue: true,
// 	subtree: true,
// };

// function rec2Obj(x) {
// 	const obj = {
// 		type: x.type,
// 		addedNodes: new Set(Array.from(x.addedNodes).map((x) => x.outerHTML)),
// 		removedNodes: new Set(Array.from(x.removedNodes).map((x) => x.outerHTML)),
// 		target: x.target instanceof Text ? x.target.data : x.target.outerHTML,
// 		oldValue: x.oldValue,
// 		attributeName: x.attributeName,
// 	};
// 	return obj;
// }

class App extends Component {
	state = { value: 0 };

	handleClick = (e) => {
		this.setState({ value: this.state.value + 1 });
	};

	render() {
		return h("div", {}, [
			h("h2", {}, `Count: ${this.state.value}`),
			h("button", { onClick: this.handleClick }, "Increment"),
		]);
	}
}

// let observer = new MutationObserver((x) => {
// 	const y = x.map(rec2Obj);
// 	console.log(y);
// });

// render(h(App), parentDom);

// observer.observe(parentDom, observeConfig);

let scratch = parentDom;

let reused = h("div", {
	class: "reuse",
	children: "Hello World!",
});
let x = h("div", {
	children: [reused, h("hr", {}), reused],
});
console.log(x);
render(x, scratch);
// expect(serializeHtml(scratch)).toBe(
// 	`<div><div class="reuse">Hello World!</div><hr><div class="reuse">Hello World!</div></div>`
// );

setTimeout(() => {
	let y = h("div", {
		children: [h("hr", {}), reused],
	});
	console.log(y);
	render(y, scratch);
}, 100);
// expect(serializeHtml(scratch)).toBe(
// 	`<div><hr><div class="reuse">Hello World!</div></div>`
// );
