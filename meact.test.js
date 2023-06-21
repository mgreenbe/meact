import "@testing-library/jest-dom";
import { render } from "./meact.js";
import { createElement as h, Fragment } from "./src/create-element.js";
// import { render as preactRender } from "./src/index.js";

test("renders text", () => {
	const c = document.createElement("div");
	render("Hello, world!", c);
	expect(c.innerHTML).toBe("Hello, world!");
});

test("renders empty p tag", () => {
	const div = document.createElement("div");
	const p = document.createElement("p");
	div.appendChild(p);

	const c = document.createElement("div");
	render(h("p"), c);
	expect(c.innerHTML).toBe(div.innerHTML);
});

test("renders p tag with text content", () => {
	const div = document.createElement("div");
	const p = document.createElement("p");
	p.textContent = "Hi, mom!";
	div.appendChild(p);

	let c = document.createElement("div");
	render(h("p", {}, "Hi, mom!"), c);
	expect(c.innerHTML).toBe(div.innerHTML);

	c = document.createElement("div");
	render(h("p", {}, ["Hi, mom!"]), c);
	expect(c.innerHTML).toBe(div.innerHTML);
});

test("renders p tag with a className", () => {
	const div = document.createElement("div");
	const p = document.createElement("p");
	p.classList.add("foo");
	div.appendChild(p);

	let c = document.createElement("div");
	render(h("p", { className: "foo" }), c);
	expect(c.innerHTML).toBe(div.innerHTML);
});

test("renders a simple list", () => {
	let c = document.createElement("div");
	const x = h("ul", {}, [
		h("li", {}, "first"),
		h("li", {}, "second"),
		h("li", {}, "third"),
	]);
	render(x, c);
	expect(c.innerHTML).toBe(
		"<ul><li>first</li><li>second</li><li>third</li></ul>"
	);
});

test("renders three nested divs", () => {
	let c = document.createElement("div");
	const x = h(
		"div",
		{ className: "outer" },
		h("div", { className: "middle" }, h("div", { className: "inner" }))
	);
	render(x, c);
	expect(c.innerHTML).toBe(
		`<div class="outer"><div class="middle"><div class="inner"></div></div></div>`
	);
});

test.skip("renders an empty fragment", () => {
	const c = document.createElement("div");
	render(h(Fragment), c);
	expect(c.innerHTML).toBe("");
});

test("renders a fragment containing text", () => {
	const c = document.createElement("div");
	render(h(Fragment, {}, "Hello, world!"), c);
	expect(c.innerHTML).toBe("Hello, world!");
});

test("renders a fragment containing elements and text", () => {
	const x = h(Fragment, {}, [
		h(
			"div",
			{ className: "outer" },
			h("div", { className: "middle" }, h("div", { className: "inner" }))
		),
		"Hi, mom!",
		h("ul", {}, [
			h("li", {}, "first"),
			h("li", {}, "second"),
			h("li", {}, "third"),
		]),
	]);
	const c = document.createElement("div");
	render(x, c);
	expect(c.innerHTML).toBe(
		`<div class="outer"><div class="middle"><div class="inner"></div></div></div>Hi, mom!<ul><li>first</li><li>second</li><li>third</li></ul>`
	);
});
