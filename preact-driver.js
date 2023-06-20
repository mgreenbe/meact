import { render, h, Fragment } from "/src/index.js";

const preactParentDom = document.getElementById("preact-parent-dom");
const vnode = h(Fragment, {}, [
	h("nav", {}, [h("a", { href: "/" }, "Home"), h("hr")]),
	h(
		"article",
		{},
		"Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit..."
	),
	h("footer", {}, [h("hr"), h("p", {}, h("i", {}, "(c) Me 2023"))]),
]);
// debugger;
render(vnode, preactParentDom);
export {};
