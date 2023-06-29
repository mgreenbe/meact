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

let trigger;
class A extends Component {
	constructor() {
		super();
		trigger = this.handleClick;
	}
	state = { show: false };

	handleClick = (e) => {
		this.setState({ show: !this.state.show });
	};

	render() {
		return h("div", {}, [
			h("p", {}, "B"),
			this.state.show ? h("div", {}, "A") : null,
		]);
	}
}

render(h(A), scratch);
console.log(scratch.innerHTML);
setTimeout(trigger, 1000);
setTimeout(() => console.log(scratch.innerHTML), 2000);

// toggleShow();
// increment();
// expect(scratch.innerHTML).to.equal("<div><p>B</p></div>");

// trigger();
// rerender();
// expect(scratch.innerHTML).to.equal("<div><div>A</div><p>B</p></div>");
