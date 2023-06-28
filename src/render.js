import { diff } from "./diff/index";
import { createElement, createVNode, Fragment } from "./create-element";

/**
 * Render a Preact virtual node into a DOM element
 * @param {import('./internal').ComponentChild} vnode The virtual node to render
 * @param {import('./internal').PreactElement} parentDom The DOM element to
 * render into
 */
export function render(vnode, parentDom) {
	let oldVNode = parentDom._children;
	// if (typeof vnode === "string") {
	// vnode = createVNode(null, vnode, null);
	// } else {
	vnode = createElement(Fragment, null, [vnode]);
	// }
	parentDom._children = vnode;
	diff(parentDom, vnode, oldVNode, parentDom.firstChild);
}
