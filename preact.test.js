import "@testing-library/jest-dom";
// import { render, createElement as h, Fragment } from "./src/index.js"; //from "./node_modules/preact/dist/preact.mjs";
import { render, createElement as h, Fragment } from "./meact.js";
import { setTimeout } from "timers/promises";

const observeConfig = {
	characterData: true,
	characterDataOldValue: true,
	attributes: true,
	childList: true,
	attributeOldValue: true,
	subtree: true,
};

const objDefaults = {
	addedNodes: [],
	removedNodes: [],
	oldValue: null,
	attributeName: null,
};

function rec2Obj(x) {
	const obj = {
		type: x.type,
		addedNodes: Array.from(x.addedNodes).map((x) => x.outerHTML),
		removedNodes: Array.from(x.removedNodes).map((x) => x.outerHTML),
		target: x.target instanceof Text ? x.target.data : x.target.outerHTML,
		oldValue: x.oldValue,
		attributeName: x.attributeName,
	};
	return obj;
}

test("change text content of root", async () => {
	const c = document.createElement("div");

	render(h(Fragment, {}, "Hello, world!"), c);

	let count = 0;
	const observer = new MutationObserver((x) => {
		count++;
		const y = x.map(rec2Obj);
		const z = [
			{
				...objDefaults,
				type: "characterData",
				oldValue: "Hello, world!",
				target: "Yo, dude!",
			},
		];
		expect(y).toEqual(z);
	});
	observer.observe(c, observeConfig);
	render(h(Fragment, {}, "Yo, dude!"), c);
	await setTimeout(17);
	observer.disconnect();
	expect(c.innerHTML).toBe(`Yo, dude!`);
	expect(count).toBe(1);
});

test("change text content of p", async () => {
	const c = document.createElement("div");

	render(h("p", {}, "Hello, world!"), c);

	let count = 0;
	const observer = new MutationObserver((x) => {
		count++;
		const y = x.map(rec2Obj);
		const z = [
			{
				...objDefaults,
				type: "characterData",
				oldValue: "Hello, world!",
				target: "Yo, dude!",
			},
		];
		expect(y).toEqual(z);
	});
	observer.observe(c, observeConfig);
	render(h("p", {}, "Yo, dude!"), c);
	await setTimeout(17);
	observer.disconnect();
	expect(c.innerHTML).toBe(`<p>Yo, dude!</p>`);
	expect(count).toBe(1);
});

test("change className of p", async () => {
	const c = document.createElement("div");

	render(h("p", { className: "foo" }), c);

	let count = 0;
	const observer = new MutationObserver((x) => {
		count++;
		const y = x.map(rec2Obj);
		const z = [
			{
				...objDefaults,
				type: "attributes",
				attributeName: "class",
				oldValue: "foo",
				target: `<p class="bar"></p>`,
			},
		];
		expect(y).toEqual(z);
	});
	observer.observe(c, observeConfig);
	render(h("p", { className: "bar" }), c);
	await setTimeout(17);
	observer.disconnect();
	expect(c.innerHTML).toBe(`<p class="bar"></p>`);
	expect(count).toBe(1);
});

test("rerender div to p", async () => {
	const c = document.createElement("div");

	render(h("div", { id: "one" }, "Hello, world!"), c);

	let count = 0;
	const observer = new MutationObserver((x) => {
		count++;
		const y = x.map(rec2Obj);
		const z = [
			{
				...objDefaults,
				type: "childList",
				target: `<div><p id="two">Yo, dude!</p></div>`,
				addedNodes: [`<p id="two">Yo, dude!</p>`],
			},
			{
				...objDefaults,
				type: "childList",
				target: `<div><p id="two">Yo, dude!</p></div>`,
				removedNodes: [`<div id="one">Hello, world!</div>`],
			},
		];
		expect(y).toEqual(z);
	});
	observer.observe(c, observeConfig);
	render(h("p", { id: "two" }, "Yo, dude!"), c);
	await setTimeout(17);
	observer.disconnect();
	expect(c.innerHTML).toBe(`<p id="two">Yo, dude!</p>`);
	expect(count).toBe(1);
});

test("rerender cyclic permutation of unkeyed list elements", async () => {
	const c = document.createElement("div");

	render(
		h("ul", {}, [
			h("li", { id: "zero" }, "0"),
			h("li", { id: "one" }, "1"),
			h("li", { id: "two" }, "2"),
		]),
		c
	);

	const ul = c.firstChild;
	const li0 = c.querySelector("#zero");
	const li1 = c.querySelector("#one");
	const li2 = c.querySelector("#two");

	let count = 0;
	let observer = new MutationObserver((x) => {
		count++;
		const y = x.map(rec2Obj);
		const z = [
			{
				...objDefaults,
				type: "attributes",
				attributeName: "id",
				oldValue: "zero",
				target: `<li id="two">0</li>`,
			},
			{
				...objDefaults,
				type: "attributes",
				attributeName: "id",
				oldValue: "one",
				target: `<li id="zero">1</li>`,
			},
			{
				...objDefaults,
				type: "attributes",
				attributeName: "id",
				oldValue: "two",
				target: `<li id="one">2</li>`,
			},
		];
		expect(y).toEqual(z);
	});
	observer.observe(c, observeConfig);
	render(
		h("ul", {}, [
			h("li", { id: "two" }, "0"),
			h("li", { id: "zero" }, "1"),
			h("li", { id: "one" }, "2"),
		]),
		c
	);
	await setTimeout(17);
	observer.disconnect();
	expect(count).toBe(1);
});

test("rerender cyclic permutation of different tags", async () => {
	const c = document.createElement("div");

	render(
		h(Fragment, {}, [
			h("a", {}, "\xa0a-0\xa0"),
			h("b", {}, "\xa0b-1\xa0"),
			h("i", {}, "\xa0i-2\xa0"),
		]),
		c
	);

	const a = c.childNodes[0];
	const b = c.childNodes[1];
	const i = c.childNodes[2];

	let count = 0;
	let observer = new MutationObserver((x) => {
		count++;
		const y = x.map(rec2Obj);
		const z = [
			{
				...objDefaults,
				type: "childList",
				target: c.outerHTML,
				removedNodes: [i.outerHTML],
			},
			{
				...objDefaults,
				type: "childList",
				target: c.outerHTML,
				addedNodes: [i.outerHTML],
			},
		];
		expect(y).toEqual(z);
	});
	observer.observe(c, observeConfig);

	render(
		h(Fragment, {}, [
			h("i", {}, "\xa0i-2\xa0"),
			h("a", {}, "\xa0a-0\xa0"),
			h("b", {}, "\xa0b-1\xa0"),
		]),
		c
	);
	await setTimeout(17);
	observer.disconnect();
	expect(count).toBe(1);

	expect(c.childNodes[0]).toBe(i);
	expect(c.childNodes[1]).toBe(a);
	expect(c.childNodes[2]).toBe(b);
});

/*
In the browser or in jsdom with imports from "./node_modules/preact/dist/preact.mjs",
the correct sequence of mutation records is
[
			{
				...objDefaults,
				type: "childList",
				target: c.outerHTML,
				removedNodes: [a.outerHTML],
			},
			{
				...objDefaults,
				type: "childList",
				target: c.outerHTML,
				addedNodes: [a.outerHTML],
			},
			{
				...objDefaults,
				type: "childList",
				target: c.outerHTML,
				removedNodes: [b.outerHTML],
			},
			{
				...objDefaults,
				type: "childList",
				target: c.outerHTML,
				addedNodes: [b.outerHTML],
			},
		]
*/

test("rerender permute, add, and remove", async () => {
	const c = document.createElement("div");

	render(h(Fragment, {}, [h("a"), h("b"), h("i")]), c);

	const a = c.childNodes[0];
	const b = c.childNodes[1];
	const i = c.childNodes[2];

	let count = 0;
	let observer = new MutationObserver((x) => {
		count++;
		const y = x.map(rec2Obj);
		const z = [
			{
				...objDefaults,
				type: "childList",
				target: c.outerHTML,
				addedNodes: [`<s></s>`],
			},
			{
				...objDefaults,
				type: "childList",
				target: c.outerHTML,
				removedNodes: [`<a></a>`],
			},
			{
				...objDefaults,
				type: "childList",
				target: c.outerHTML,
				addedNodes: [`<a></a>`],
			},
			{
				...objDefaults,
				type: "childList",
				target: c.outerHTML,
				addedNodes: [`<b></b>`],
			},
			{
				...objDefaults,
				type: "childList",
				target: c.outerHTML,
				addedNodes: [`<s></s>`],
			},
			{
				...objDefaults,
				type: "childList",
				target: c.outerHTML,
				removedNodes: [`<i></i>`],
			},
		];
		expect(y).toEqual(z);
	});
	observer.observe(c, observeConfig);

	render(h(Fragment, {}, [h("b"), h("s"), h("a"), h("b"), h("s")]), c);
	await setTimeout(17);
	observer.disconnect();
	expect(count).toBe(1);

	expect(c.childNodes[0]).toBe(b);
	console.log(c.childNodes[1].tagName, c.childNodes[4].tagName);
	expect(c.childNodes[1]).not.toBe(c.childNodes[4]);
	expect(c.childNodes[2]).toBe(a);
	expect(c.childNodes[3]).not.toBe(b);
});

test("rerender other cyclic permutation of different tags", async () => {
	const c = document.createElement("div");

	render(
		h(Fragment, {}, [
			h("a", {}, "\xa0a-0\xa0"),
			h("b", {}, "\xa0b-1\xa0"),
			h("i", {}, "\xa0i-2\xa0"),
		]),
		c
	);

	const a = c.childNodes[0];
	const b = c.childNodes[1];
	const i = c.childNodes[2];

	let count = 0;
	let observer = new MutationObserver((x) => {
		count++;
		const y = x.map(rec2Obj);
		const z = [
			{
				...objDefaults,
				type: "childList",
				target: c.outerHTML,
				removedNodes: [a.outerHTML],
			},
			{
				...objDefaults,
				type: "childList",
				target: c.outerHTML,
				addedNodes: [a.outerHTML],
			},
		];
		expect(y).toEqual(z);
	});
	observer.observe(c, observeConfig);

	render(
		h(Fragment, {}, [
			h("b", {}, "\xa0b-1\xa0"),
			h("i", {}, "\xa0i-2\xa0"),
			h("a", {}, "\xa0a-0\xa0"),
		]),
		c
	);
	await setTimeout(17);
	observer.disconnect();
	expect(count).toBe(1);

	expect(c.childNodes[0]).toBe(b);
	expect(c.childNodes[1]).toBe(i);
	expect(c.childNodes[2]).toBe(a);
});

test("rerender cyclic permutation of keyed list elements", async () => {
	const c = document.createElement("div");

	render(
		h("ul", {}, [
			h("li", { key: 0 }, "0"),
			h("li", { key: 1 }, "1"),
			h("li", { key: 2 }, "2"),
		]),
		c
	);

	const ul = c.querySelector("ul");
	const li0 = ul.childNodes[0];
	const li1 = ul.childNodes[1];
	const li2 = ul.childNodes[2];

	let count = 0;
	let observer = new MutationObserver((x) => {
		count++;
		const y = x.map(rec2Obj);
		console.log(y);
		const z = [
			{
				...objDefaults,
				type: "childList",
				target: ul.outerHTML,
				removedNodes: [li2.outerHTML],
			},
			{
				...objDefaults,
				type: "childList",
				target: ul.outerHTML,
				addedNodes: [li2.outerHTML],
			},
		];
		expect(y).toEqual(z);
	});
	observer.observe(c, observeConfig);

	render(
		h("ul", {}, [
			h("li", { key: 2 }, "2"),
			h("li", { key: 0 }, "0"),
			h("li", { key: 1 }, "1"),
		]),
		c
	);
	await setTimeout(17);
	observer.disconnect();
	expect(count).toBe(1);

	expect(ul.childNodes[0]).toBe(li2);
	expect(ul.childNodes[1]).toBe(li0);
	expect(ul.childNodes[2]).toBe(li1);
});

/*
In the browser or in jsdom with imports from "./node_modules/preact/dist/preact.mjs",
the correct sequence of mutation records is
[
			{
				...objDefaults,
				type: "childList",
				target: ul.outerHTML,
				removedNodes: [li0.outerHTML],
			},
			{
				...objDefaults,
				type: "childList",
				target: ul.outerHTML,
				addedNodes: [li0.outerHTML],
			},
			{
				...objDefaults,
				type: "childList",
				target: ul.outerHTML,
				removedNodes: [li1.outerHTML],
			},
			{
				...objDefaults,
				type: "childList",
				target: ul.outerHTML,
				addedNodes: [li1.outerHTML],
			},
		]
*/

test("rerender other cyclic permutation of keyed list elements", async () => {
	const c = document.createElement("div");

	render(
		h("ul", {}, [
			h("li", { key: 0 }, "0"),
			h("li", { key: 1 }, "1"),
			h("li", { key: 2 }, "2"),
		]),
		c
	);

	const ul = c.querySelector("ul");
	const li0 = ul.childNodes[0];
	const li1 = ul.childNodes[1];
	const li2 = ul.childNodes[2];

	let count = 0;
	let observer = new MutationObserver((x) => {
		count++;
		const y = x.map(rec2Obj);
		const z = [
			{
				...objDefaults,
				type: "childList",
				target: ul.outerHTML,
				removedNodes: [li0.outerHTML],
			},
			{
				...objDefaults,
				type: "childList",
				target: ul.outerHTML,
				addedNodes: [li0.outerHTML],
			},
		];
		expect(y).toEqual(z);
	});
	observer.observe(c, observeConfig);

	render(
		h("ul", {}, [
			h("li", { key: 1 }, "1"),
			h("li", { key: 2 }, "2"),
			h("li", { key: 0 }, "0"),
		]),
		c
	);
	await setTimeout(17);
	observer.disconnect();
	expect(count).toBe(1);

	expect(ul.childNodes[0]).toBe(li1);
	expect(ul.childNodes[1]).toBe(li2);
	expect(ul.childNodes[2]).toBe(li0);
});

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
