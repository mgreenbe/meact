import "@testing-library/jest-dom";
import {
	render,
	createElement as h,
	Fragment,
	Component,
} from "./src/index.js"; //from "./node_modules/preact/dist/preact.mjs";
import { serializeHtml } from "./test/_util/helpers.mjs";
import { setTimeout } from "timers/promises";

function getAttributes(node) {
	let attrs = {};
	for (let i = node.attributes.length; i--; ) {
		attrs[node.attributes[i].name] = node.attributes[i].value;
	}
	return attrs;
}

let scratch;

beforeEach(() => (scratch = document.createElement("div")));

it('should rerender when value from "" to 0', () => {
	scratch = document.createElement("div");
	render("", scratch);
	expect(scratch.innerHTML).toBe("");

	render(0, scratch);
	expect(scratch.innerHTML).toBe("0");
});

it("should render an empty text node given an empty string", () => {
	render("", scratch);
	let c = scratch.childNodes;
	expect(c.length).toBe(1);
	expect(c[0].data).toBe("");
	expect(c[0].nodeName).toBe("#text");
});

it("should allow node type change with content", () => {
	render(h("span", {}, "Bad"), scratch);
	render(h("div", {}, "Good"), scratch);
	expect(scratch.innerHTML).toBe(`<div>Good</div>`);
});

it("should render % width and height on img correctly", () => {
	render(h("img", { width: "100%", height: "100%" }), scratch);
	expect(scratch.innerHTML).toBe(`<img width="100%" height="100%">`);
});

it("should create empty nodes (<* />)", () => {
	render(h("div"), scratch);
	expect(scratch.childNodes.length).toBe(1);
	expect(scratch.childNodes[0].nodeName).toBe("DIV");

	scratch = document.createElement("div");
	render(h("span"), scratch);
	expect(scratch.childNodes.length).toBe(1);
	expect(scratch.childNodes[0].nodeName).toBe("SPAN");
});

it("should support custom tag names", () => {
	render(h("foo"), scratch);
	expect(scratch.childNodes.length).toBe(1);
	expect(scratch.firstChild).toHaveProperty("nodeName", "FOO");

	scratch = document.createElement("div");

	render(h("x-bar"), scratch);
	expect(scratch.childNodes).toHaveLength(1);
	expect(scratch.firstChild).toHaveProperty("nodeName", "X-BAR");
});

it("should support the form attribute", () => {
	render(
		h("div", {
			children: [
				h("form", {
					id: "myform",
				}),
				h("button", {
					form: "myform",
					children: "test",
				}),
				h("input", {
					form: "myform",
				}),
			],
		}),
		scratch
	);
	const div = scratch.childNodes[0];
	const form = div.childNodes[0];
	const button = div.childNodes[1];
	const input = div.childNodes[2];

	expect(button).toHaveProperty("form", form);
	expect(input).toHaveProperty("form", form);
});

it("should allow VNode reuse", () => {
	// childVNode._depth needed here
	let reused = h("div", {
		class: "reuse",
		children: "Hello World!",
	});
	render(
		h("div", {
			children: [reused, h("hr", {}), reused],
		}),
		scratch
	);
	expect(serializeHtml(scratch)).toBe(
		`<div><div class="reuse">Hello World!</div><hr><div class="reuse">Hello World!</div></div>`
	);

	reused = h("div", {
		class: "reuse",
		children: "Hello World!",
	});
	const x = h("div", {
		children: [h("hr", {}), reused],
	});
	render(x, scratch);
	expect(serializeHtml(scratch)).toBe(
		`<div><hr><div class="reuse">Hello World!</div></div>`
	);
});

it.skip("should merge new elements when called multiple times", () => {
	render(h("div"), scratch);
	expect(scratch.childNodes).toHaveLength(1);
	expect(scratch.firstChild).toHaveProperty("nodeName", "DIV");
	expect(scratch.innerHTML).toBe("<div></div>");

	render(h("span"), scratch);
	expect(scratch.childNodes).toHaveLength(1);
	expect(scratch.firstChild).toHaveProperty("nodeName", "SPAN");
	expect(scratch.innerHTML).toBe("<span></span>");

	render(h("span", {}, "Hello!"), scratch);
	expect(scratch.childNodes).toHaveLength(1);
	expect(scratch.firstChild).toHaveProperty("nodeName", "SPAN");
	expect(scratch.innerHTML).toBe("<span>Hello!</span>"); // fails
});

it("should nest empty nodes", () => {
	render(
		h("div", {
			children: [h("span", {}), h("foo", {}), h("x-bar", {})],
		}),
		scratch
	);

	expect(scratch.childNodes).toHaveLength(1);
	expect(scratch.childNodes[0].nodeName).toBe("DIV");

	let c = scratch.childNodes[0].childNodes;
	expect(c).toHaveLength(3);
	expect(c[0].nodeName).toBe("SPAN");
	expect(c[1].nodeName).toBe("FOO");
	expect(c[2].nodeName).toBe("X-BAR");
});

it("should not render falsy values", () => {
	render(
		h("div", {
			children: [null, ",", undefined, ",", false, ",", 0, ",", NaN],
		}),
		scratch
	);

	expect(scratch.firstChild).toHaveProperty("innerHTML", ",,,0,NaN");
});

it("should not render undefined", () => {
	render(undefined, scratch);
	expect(scratch.innerHTML).toBe("");
	expect(scratch.childNodes).toHaveLength(0);
});

it("should not render boolean true", () => {
	render(true, scratch);
	expect(scratch.innerHTML).toBe("");
	expect(scratch.childNodes).toHaveLength(0);
});

it("should not render boolean false", () => {
	render(false, scratch);
	expect(scratch.innerHTML).toBe("");
	expect(scratch.childNodes).toHaveLength(0);
});

it("should not render children when using function children", () => {
	render(
		h("div", {
			children: () => {},
		}),
		scratch
	);
	expect(scratch.innerHTML).toBe("<div></div>");
});

it("should not render children when rerendering a function child", () => {
	const icon = () => {};

	render(
		h("div", {
			children: icon,
		}),
		scratch
	);
	expect(scratch.innerHTML).toBe("<div></div>");

	render(
		h("div", {
			children: icon,
		}),
		scratch
	);
	expect(scratch.innerHTML).toBe("<div></div>");
});

it("should render NaN as text content", () => {
	render(NaN, scratch);
	expect(scratch.innerHTML).toBe("NaN");
});

it("should render numbers (0) as text content", () => {
	render(0, scratch);
	expect(scratch.innerHTML).toBe("0");
});

it("should render numbers (42) as text content", () => {
	render(42, scratch);
	expect(scratch.innerHTML).toBe("42");
});

it("should render bigint as text content", () => {
	render(BigInt(4), scratch);
	expect(scratch.innerHTML).toBe("4");
});

it("should render strings as text content", () => {
	render("Testing, huh! How is it going?", scratch);
	expect(scratch.innerHTML).toBe("Testing, huh! How is it going?");
});

it("should render arrays of mixed elements", () => {
	const Foo = () => "d";
	const mixedArray = [
		0,
		"a",
		"b",
		h("span", {}, "c"),
		h(Foo, {}),
		null,
		undefined,
		false,
		["e", "f"],
		1,
	];
	render(mixedArray, scratch);
	const mixedArrayHTML = "0ab<span>c</span>def1";
	expect(scratch.innerHTML).toBe(mixedArrayHTML);
});

it("should clear falsy attributes", () => {
	render(
		h("div", {
			anull: "anull",
			aundefined: "aundefined",
			afalse: "afalse",
			anan: "aNaN",
			a0: "a0",
		}),
		scratch
	);

	render(
		h("div", {
			anull: null,
			aundefined: undefined,
			afalse: false,
			anan: NaN,
			a0: 0,
		}),
		scratch
	);

	expect(getAttributes(scratch.firstChild)).toEqual({
		a0: "0",
		anan: "NaN",
	});
});

it("should not render falsy attributes on hydrate", () => {
	render(
		h("div", {
			anull: null,
			aundefined: undefined,
			afalse: false,
			anan: NaN,
			a0: 0,
		}),
		scratch
	);

	expect(getAttributes(scratch.firstChild)).toEqual({
		a0: "0",
		anan: "NaN",
	});
});

it("should clear falsy input values", () => {
	// Note: this test just demonstrates the default browser behavior
	render(
		h("div", {
			children: [
				h("input", { value: 0 }),
				h("input", { value: false }),
				h("input", { value: null }),
				h("input", { value: undefined }),
			],
		}),
		scratch
	);

	let root = scratch.firstChild;
	expect(root.children[0]).toHaveProperty("value", "0");
	expect(root.children[1]).toHaveProperty("value", "false");
	expect(root.children[2]).toHaveProperty("value", "");
	expect(root.children[3]).toHaveProperty("value", "");
});

it("should set value inside the specified range", () => {
	render(
		h("input", {
			type: "range",
			value: 0.5,
			min: "0",
			max: "1",
			step: "0.05",
		}),
		scratch
	);
	expect(scratch.firstChild.value).toEqual("0.5");
});

it.skip("should also update the current dom", () => {
	let trigger;

	class A extends Component {
		constructor(props) {
			super(props);
			this.state = { show: false };
			trigger = this.set = this.set.bind(this);
		}

		set() {
			this.setState({ show: true });
		}

		render() {
			return this.state.show ? h("div", {}, "A") : null;
		}
	}

	const B = () => h("p", {}, "B");

	render(h("div", {}, [h(A), h(B)]), scratch);
	expect(scratch.innerHTML).toBe("<div><p>B</p></div>");

	trigger();
	rerender();
	expect(scratch.innerHTML).toBe("<div><div>A</div><p>B</p></div>");
});
