import { createElement, Fragment } from "./create-element.js";

export function render(vnode, parentDom) {
	let oldVNode = parentDom._children;

	// vnode = parentDom._children = createElement(Fragment, null, [vnode]);
	// parentDom._children = [vnode];

	diff(
		parentDom,
		// Determine the new vnode tree and store it on the DOM element on
		// our custom `_children` property.
		vnode,
		oldVNode ?? {},
		oldVNode
			? null
			: parentDom.firstChild
			? Array.prototype.slice.call(parentDom.childNodes)
			: null, // excessDomChildren
		oldVNode?._dom ?? parentDom.firstChild
	);
}
