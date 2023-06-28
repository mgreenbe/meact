import { Fragment } from "../create-element";
import { diffChildren } from "./children";
import { diffProps } from "./props";

/**
 * Diff two virtual nodes and apply proper changes to the DOM
 * @param {import('../internal').PreactElement} parentDom The parent of the DOM element
 * @param {import('../internal').VNode} newVNode The new virtual node
 * @param {import('../internal').VNode} oldVNode The old virtual node
 * @param {import('../internal').PreactElement} oldDom The current attached DOM
 */
export function diff(parentDom, newVNode, oldVNode = {}, oldDom = null) {
	const {
		type: newType,
		props: { children },
	} = newVNode;
	if (newType === Fragment) {
		const childVNodes = Array.isArray(children) ? children : [children];
		diffChildren(parentDom, childVNodes, newVNode, oldVNode, oldDom);
	} else {
		newVNode._dom = diffElementNodes(oldVNode._dom, newVNode, oldVNode);
	}
}

/**
 * Diff two virtual nodes representing DOM element
 * @param {import('../internal').PreactElement} dom The DOM element representing
 * the virtual nodes being diffed
 * @param {import('../internal').VNode} newVNode The new virtual node
 * @param {import('../internal').VNode} oldVNode The old virtual node
 * @returns {import('../internal').PreactElement}
 */
function diffElementNodes(dom, newVNode, oldVNode) {
	let oldProps = oldVNode.props;
	let newProps = newVNode.props;
	let newType = newVNode.type;

	if (dom == null) {
		if (newType === null) {
			// new text node
			return document.createTextNode(newProps);
		} else {
			dom = document.createElement(newType);
		}
	}
	if (newType === null) {
		// text node
		if (oldProps !== newProps) {
			dom.data = newProps;
		}
	} else {
		oldProps = oldVNode.props || {};
		diffProps(dom, newProps, oldProps);
		let i = newVNode.props.children;
		diffChildren(
			dom,
			Array.isArray(i) ? i : [i],
			newVNode,
			oldVNode,
			oldVNode._children && getDomSibling(oldVNode, 0)
		);
	}
	return dom;
}

/**
 * Invoke or update a ref, depending on whether it is a function or object ref.
 * @param {object|function} ref
 * @param {any} value
 * @param {import('../internal').VNode} vnode
 */
export function applyRef(ref, value, vnode) {
	if (typeof ref == "function") ref(value);
	else ref.current = value;
}

/**
 * Unmount a virtual node from the tree and apply DOM changes
 * @param {import('../internal').VNode} vnode The virtual node to unmount
 * @param {import('../internal').VNode} parentVNode The parent of the VNode that
 * initiated the unmount
 * @param {boolean} [skipRemove] Flag that indicates that a parent node of the
 * current element is already detached from the DOM.
 */
export function unmount(vnode) {
	const node = vnode._dom;
	if (node !== null) {
		const parentNode = node.parentNode;
		if (parentNode) {
			parentNode.removeChild(node);
		}
	}
}

function getDomSibling(vnode, childIndex) {
	for (; childIndex < vnode._children.length; childIndex++) {
		let sibling = vnode._children[childIndex];
		if (sibling != null) {
			return sibling._dom;
		}
	}
	// If we get here, we have not found a DOM node in this vnode's children.
	// We must resume from this vnode's sibling (in it's parent _children array)
	// Only climb up and search the parent if we aren't searching through a DOM
	// VNode (meaning we reached the DOM parent of the original vnode that began
	// the search)
	return null;
}
