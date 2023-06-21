import "@testing-library/jest-dom";
import { render, createElement as h, Fragment } from "./meact.js";

test("renders text", () => {
	const c = document.createElement("div");
	render("Hello, world!", c);
	expect(c.innerHTML).toBe("Hello, world!");
});

test("renders a number", () => {
	const c = document.createElement("div");
	render(666.666, c);
	expect(c.innerHTML).toBe("666.666");
});

test("renders a boolean", () => {
	const c = document.createElement("div");
	render(true, c);
	expect(c.innerHTML).toBe("");
});

test("renders null", () => {
	const c = document.createElement("div");
	render(null, c);
	expect(c.innerHTML).toBe("");
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

test("renders an empty fragment", () => {
	const c = document.createElement("div");
	render(h(Fragment), c);
	expect(c.innerHTML).toBe("");
});

test("renders nested empty fragments", () => {
	const c = document.createElement("div");
	render(h(Fragment, {}, h(Fragment, {}, h(Fragment))), c);
	expect(c.innerHTML).toBe("");
});

test("renders nested fragments", () => {
	const c = document.createElement("div");
	render(
		h(
			Fragment,
			{},
			"outer",
			h(Fragment, {}, h(Fragment, {}, "-middle-"), "inner")
		),
		c
	);
	expect(c.innerHTML).toBe("outer-middle-inner");
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

test("renders a simple list with fragments not at top level", () => {
	let c = document.createElement("div");
	const x = h("ul", {}, [
		h("li", {}, h(Fragment, {}, "first")),
		h("li", {}, h(Fragment, {}, "second")),
		h("li", {}, h(Fragment, {}, "third")),
	]);
	render(x, c);
	expect(c.innerHTML).toBe(
		"<ul><li>first</li><li>second</li><li>third</li></ul>"
	);
});

test("simple site", () => {
	let c = document.createElement("div");
	let x = h("div", {}, [
		h("nav", {}, [h("a", { href: "/" }, "Home"), h("hr")]),
		h(
			"article",
			{
				key: "Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit...",
			},
			"Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit..."
		),
		h("footer", {}, [h("hr"), h("p", {}, h("i", {}, "(c) Me 2023"))]),
	]);
	render(x, c);
	expect(c.innerHTML).toBe(
		`<div><nav><a href="/">Home</a><hr></nav><article>Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit...</article><footer><hr><p><i>(c) Me 2023</i></p></footer></div>`
	);
});
