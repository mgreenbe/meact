import "@testing-library/jest-dom";
import {
	render,
	createElement as h,
	Fragment,
	Component,
} from "./src/index.js"; //from "./node_modules/preact/dist/preact.mjs";
import { serializeHtml } from "./test/_util/helpers.mjs";

import { setTimeout } from "timers/promises";

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
