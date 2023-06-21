import { createElement as h, Fragment } from "/src/create-element.js";
import { render } from "./meact.js";

console.log("~~~~~\nMeact\n~~~~~");

const parentDom = document.getElementById("meact-parent-dom");

// const observer = new MutationObserver((muts) => {
// 	for (let mut of muts) {
// 		console.log(mut);
// 	}
// });

// observer.observe(parentDom, {
// 	attributeOldValue: true,
// 	characterData: true,
// 	characterDataOldValue: true,
// 	attributes: true,
// 	childList: true,
// 	subtree: true,
// });

let vnode = h(Fragment, {}, [
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

render(vnode, parentDom);

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
