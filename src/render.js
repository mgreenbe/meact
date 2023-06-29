import { commitRoot, diff } from "./diff/index";
import { createElement, Fragment } from "./create-element";

/**
 * Render a Preact virtual node into a DOM element
 * @param {import('./_internal').ComponentChild} vnode The virtual node to render
 * @param {import('./_internal').PreactElement} parentDom The DOM element to
 * render into
 * @param {import('./_internal').PreactElement | object} [replaceNode] Optional: Attempt to re-use an
 * existing DOM tree rooted at `replaceNode`
 */
export function render(vnode, parentDom) {
	let oldVNode = parentDom._children;

	vnode = parentDom._children = createElement(Fragment, null, [vnode]);

	// List of effects that need to be called after diffing.
	let commitQueue = [];
	diff(
		parentDom,
		// Determine the new vnode tree and store it on the DOM element on
		// our custom `_children` property.
		vnode,
		oldVNode || {},
		undefined,
		undefined,
		undefined,
		commitQueue,
		oldVNode ? oldVNode._dom : parentDom.firstChild
	);

	// Flush all queued effects
	commitRoot(commitQueue, vnode);
}

/**
 * Update an existing DOM element with data from a Preact virtual node
 * @param {import('./_internal').ComponentChild} vnode The virtual node to render
 * @param {import('./_internal').PreactElement} parentDom The DOM element to
 * update
 */
export function hydrate(vnode, parentDom) {
	render(vnode, parentDom, hydrate);
}
