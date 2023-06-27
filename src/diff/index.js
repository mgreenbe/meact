import { getDomSibling } from "../component";
import { diffChildren } from "./children";
import { diffProps } from "./props";
import { removeNode } from "../util";

/**
 * Diff two virtual nodes and apply proper changes to the DOM
 * @param {import('../internal').PreactElement} parentDom The parent of the DOM element
 * @param {import('../internal').VNode} newVNode The new virtual node
 * @param {import('../internal').VNode} oldVNode The old virtual node
 * @param {import('../internal').PreactElement} oldDom The current attached DOM
 */
export function diff(parentDom, newVNode, oldVNode, oldDom) {
	const { type: newType, props: newProps } = newVNode;
	if (typeof newType == "function") {
		let renderResult = newProps.children;
		diffChildren(
			parentDom,
			Array.isArray(renderResult) ? renderResult : [renderResult],
			newVNode,
			oldVNode,
			oldDom
		);
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
	let nodeType = newVNode.type;
	let i = 0;

	if (dom == null) {
		if (nodeType === null) {
			return document.createTextNode(newProps);
		}
		dom = document.createElement(nodeType, newProps.is && newProps);
	}
	if (nodeType === null) {
		if (oldProps !== newProps) {
			dom.data = newProps;
		}
	} else {
		oldProps = oldVNode.props || {};
		diffProps(dom, newProps, oldProps);
		i = newVNode.props.children;
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
export function unmount(vnode, parentVNode, skipRemove) {
	let r;
	if ((r = vnode.ref)) {
		if (!r.current || r.current === vnode._dom) {
			applyRef(r, null, parentVNode);
		}
	}

	if ((r = vnode._component) != null) {
		if (r.componentWillUnmount) {
			r.componentWillUnmount();
		}

		r.base = r._parentDom = null;
		vnode._component = undefined;
	}

	if ((r = vnode._children)) {
		for (let i = 0; i < r.length; i++) {
			if (r[i]) {
				unmount(
					r[i],
					parentVNode,
					skipRemove || typeof vnode.type !== "function"
				);
			}
		}
	}

	if (!skipRemove && vnode._dom != null) {
		removeNode(vnode._dom);
	}

	// Must be set to `undefined` to properly clean up `_nextDom`
	// for which `null` is a valid value. See comment in `create-element.js`
	vnode._parent = vnode._dom = vnode._nextDom = undefined;
}
