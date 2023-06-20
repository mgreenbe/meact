import { render, h, Fragment } from "/src/index.js";

console.log("~~~~~~\nPreact\n~~~~~~");
const parentDom = document.getElementById("preact-parent-dom");

const observer = new MutationObserver((muts) => {
	for (let mut of muts) {
		console.log(mut);
	}
});

observer.observe(parentDom, {
	characterData: true,
	characterDataOldValue: true,
	attributes: true,
	childList: true,
	subtree: true,
});

let vnode = h(Fragment, {}, [
	h("nav", {}, [h("a", { href: "/" }, "Home"), h("hr")]),
	h(
		"article",
		{},
		"Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit..."
	),
	h("footer", {}, [h("hr"), h("p", {}, h("i", {}, "(c) Me 2023"))]),
]);

render(vnode, parentDom);

vnode = h(Fragment, {}, [
	h("nav", {}, [h("a", { href: "/abc" }, "Home"), h("hr")]),
	h("article", {}, "asdfasdfsdfasdfa"),
	h("footer", {}, [h("hr"), h("p", {}, h("i", {}, "(c) Me 2023"))]),
]);

setTimeout(() => {
	console.log("Rendering again");
	render(vnode, parentDom);
}, 1000);
