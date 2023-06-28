import { diff } from "./diff/index";
import { createElement, Fragment } from "./create-element";

/**
 * Render a Preact virtual node into a DOM element
 * @param {import('./internal').ComponentChild} vnode The virtual node to render
 * @param {import('./internal').PreactElement} parentDom The DOM element to
 * render into
 */
export function render(vnode, parentDom) {
	let oldVNode = parentDom._vnode;
	vnode = createElement(Fragment, null, [vnode]);
	Object.freeze(vnode);
	parentDom._vnode = vnode; // need _vnode property on parentDom for rerendering
	diff(parentDom, vnode, oldVNode, parentDom.firstChild);
}
