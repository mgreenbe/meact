import { diff, commitRoot } from "./diff/index";
import { Fragment } from "./create-element";

/**
 * Base Component class. Provides `setState()` and `forceUpdate()`, which
 * trigger rendering
 * @param {object} props The initial component props
 * @param {object} context The initial context from parent components'
 * getChildContext
 */
export function Component(props, context) {
	this.props = props;
	this.context = context;
}

/**
 * Update component state and schedule a re-render.
 * @this {import('./_internal').Component}
 * @param {object | ((s: object, p: object) => object)} update A hash of state
 * properties to update with new values or a function that given the current
 * state and props returns a new partial state
 * @param {() => void} [callback] A function to be called once component state is
 * updated
 */
Component.prototype.setState = function (update) {
	if (update) {
		Object.assign(this._nextState, this.state, update);
		renderComponent(this);
	}
};

/**
 * Accepts `props` and `state`, and returns a new Virtual DOM tree to build.
 * Virtual DOM is generally constructed via [JSX](http://jasonformat.com/wtf-is-jsx).
 * @param {object} props Props (eg: JSX attributes) received from parent
 * element/component
 * @param {object} state The component's current state
 * @param {object} context Context object, as returned by the nearest
 * ancestor's `getChildContext()`
 * @returns {import('./index').ComponentChildren | void}
 */
Component.prototype.render = Fragment;

/**
 * @param {import('./_internal').VNode} vnode
 * @param {number | null} [childIndex]
 */
export function getDomSibling(vnode, childIndex) {
	if (childIndex == null) {
		// Use childIndex==null as a signal to resume the search from the vnode's sibling
		return vnode._parent
			? getDomSibling(vnode._parent, vnode._parent._children.indexOf(vnode) + 1)
			: null;
	}

	let sibling;
	for (; childIndex < vnode._children.length; childIndex++) {
		sibling = vnode._children[childIndex];

		if (sibling != null && sibling._dom != null) {
			// Since updateParentDomPointers keeps _dom pointer correct,
			// we can rely on _dom to tell us if this subtree contains a
			// rendered DOM node, and what the first rendered DOM node is
			return sibling._dom;
		}
	}

	// If we get here, we have not found a DOM node in this vnode's children.
	// We must resume from this vnode's sibling (in it's parent _children array)
	// Only climb up and search the parent if we aren't searching through a DOM
	// VNode (meaning we reached the DOM parent of the original vnode that began
	// the search)
	return typeof vnode.type == "function" ? getDomSibling(vnode) : null;
}

/**
 * Trigger in-place re-rendering of a component.
 * @param {import('./_internal').Component} component The component to rerender
 */
function renderComponent(component) {
	let vnode = component._vnode,
		oldDom = vnode._dom,
		parentDom = component._parentDom;

	if (parentDom) {
		let commitQueue = [];
		const oldVNode = { ...vnode };
		oldVNode._original = vnode._original + 1;

		diff(
			parentDom,
			vnode,
			oldVNode,
			undefined,
			undefined,
			undefined,
			commitQueue,
			oldDom == null ? getDomSibling(vnode) : oldDom,
			undefined
		);
		commitRoot(commitQueue, vnode);

		// if (vnode._dom != oldDom) {
		// 	// updateParentDomPointers(vnode);
		// }
	}
}

/**
 * @param {import('./internal').Component} a
 * @param {import('./internal').Component} b
 */

// /**
//  * @param {import('./_internal').VNode} vnode
//  */
// function updateParentDomPointers(vnode) {
// 	if ((vnode = vnode._parent) != null && vnode._component != null) {
// 		vnode._dom = vnode._component.base = null;
// 		for (let i = 0; i < vnode._children.length; i++) {
// 			let child = vnode._children[i];
// 			if (child != null && child._dom != null) {
// 				vnode._dom = vnode._component.base = child._dom;
// 				break;
// 			}
// 		}

// 		return updateParentDomPointers(vnode);
// 	}
// }
