import { render, h, Fragment } from "/src/index.js";

console.log("~~~~~~\nPreact\n~~~~~~");
const parentDom = document.getElementById("preact-parent-dom");

// const vnode = "hi";
// const vnode = h(Fragment);
// const vnode = true;
// render(vnode, parentDom);
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
	attributeOldValue: true,
	subtree: true,
});

render("Hello, world!", parentDom);
render("Yo, dude!", parentDom);
// let vnode = h("p", { className: "foo" }, "Hi, mom!");
// render(vnode, parentDom);
// vnode = h("p", { className: "foo" }, "Yo, dude!");
// render(vnode, parentDom);

// vnode = h("p", { className: "bar" });
// render(vnode, parentDom);

// let vnode = h(Fragment, {}, [
// 	h("nav", {}, [h("a", { href: "/" }, "Home"), h("hr")]),
// 	h(
// 		"article",
// 		{
// 			key: "Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit...",
// 		},
// 		"Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit..."
// 	),
// 	h("footer", {}, [h("hr"), h("p", {}, h("i", {}, "(c) Me 2023"))]),
// ]);

// render(vnode, parentDom);

// vnode = h(Fragment, {}, [
// 	h("nav", {}, [h("a", { href: "/abc" }, "Home")]),
// 	h("article", {}, "asdfasdfsdfasdfa"),
// 	h(
// 		"article",
// 		{
// 			key: "Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit...",
// 		},
// 		"Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit..."
// 	),
// 	h("footer", {}, [h("hr"), h("p", {}, h("b", {}, "(c) Me 2023"))]),
// ]);

// setTimeout(() => {
// 	console.log("Rendering again");
// 	render(vnode, parentDom);
// }, 1000);
