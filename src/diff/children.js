import { diff, unmount } from "./index";
import { createVNode } from "../create-element";

/**
 * Diff the children of a virtual node
 * @param {import('../internal').PreactElement} parentDom The DOM element whose
 * children are being diffed
 * @param {import('../internal').ComponentChildren[]} renderResult
 * @param {import('../internal').VNode} newParentVNode The new virtual
 * node whose children should be diff'ed against oldParentVNode
 * @param {import('../internal').VNode} oldParentVNode The old virtual
 * node whose children should be diff'ed against newParentVNode
 * @param {import('../internal').PreactElement} oldDom The current attached DOM
 * element any new dom elements should be placed around. Likely `null` on first
 * render (except when hydrating). Can be a sibling DOM element when diffing
 * Fragments that have siblings. In most cases, it starts out as `oldChildren[0]._dom`.
 * @param {boolean} isHydrating Whether or not we are in hydration
 */
export function diffChildren(
	parentDom,
	renderResult,
	newParentVNode,
	oldParentVNode,
	oldDom
) {
	let oldVNode, childVNode, newDom;

	// This is a compression of oldParentVNode!=null && oldParentVNode != EMPTY_OBJ && oldParentVNode._children || EMPTY_ARR
	// as EMPTY_OBJ._children should be `undefined`.
	let oldChildren = (oldParentVNode && oldParentVNode._children) || [];

	let oldChildrenLength = oldChildren.length,
		newChildrenLength = renderResult.length;

	newParentVNode._children = [];
	for (let i = 0; i < newChildrenLength; i++) {
		childVNode = renderResult[i];

		if (
			childVNode == null ||
			typeof childVNode == "boolean" ||
			typeof childVNode == "function"
		) {
			childVNode = newParentVNode._children[i] = null;
		}
		// If this newVNode is being reused (e.g. <div>{reuse}{reuse}</div>) in the same diff,
		// or we are rendering a component (e.g. setState) copy the oldVNodes so it can have
		// it's own DOM & etc. pointers
		else if (typeof childVNode == "string" || typeof childVNode == "number") {
			childVNode = newParentVNode._children[i] = createVNode(
				null,
				childVNode,
				null
			);
		} else if (childVNode._depth > 0) {
		} else {
			childVNode = newParentVNode._children[i] = childVNode;
		}

		// Terser removes the `continue` here and wraps the loop body
		// in a `if (childVNode) { ... } condition
		if (childVNode == null) {
			continue;
		}

		childVNode._parent = newParentVNode;

		const matchingIndex = findMatchingIndex(childVNode, oldChildren, i);

		if (matchingIndex === -1) {
			oldVNode = {};
		} else {
			oldVNode = oldChildren[matchingIndex] || {};
			oldChildren[matchingIndex] = undefined;
		}

		// Morph the old element into the new one, but don't append it to the dom yet
		diff(parentDom, childVNode, oldVNode, oldDom);

		newDom = childVNode._dom;

		if (newDom != null) {
			let hasMatchingIndex = matchingIndex === i;
			if (matchingIndex === i + 1) {
				hasMatchingIndex = true;
			}
			if (!hasMatchingIndex) {
				oldDom = placeChild(parentDom, newDom, oldDom);
			} else if (childVNode._nextDom === undefined) {
				oldDom = newDom.nextSibling;
			}
		}
	}

	// Remove remaining oldChildren if there are any.
	for (let i = oldChildrenLength; i--; ) {
		if (oldChildren[i] != null) {
			unmount(oldChildren[i], oldChildren[i]);
		}
	}
}

function placeChild(parentDom, newDom, oldDom) {
	if (oldDom === null || newDom !== oldDom) {
		parentDom.insertBefore(newDom, oldDom);
	}
	return newDom.nextSibling;
}

/**
 * @param {import('../internal').VNode | string} childVNode
 * @param {import('../internal').VNode[]} oldChildren
 * @param {number} skewedIndex
 * @returns {number}
 */
function findMatchingIndex(childVNode, oldChildren, i) {
	const key = childVNode.key;
	const type = childVNode.type;
	let x = i - 1;
	let y = i + 1;
	let oldVNode = oldChildren[i];

	if (
		oldVNode === null ||
		(oldVNode && key == oldVNode.key && type === oldVNode.type)
	) {
		return i;
	} else {
		while (x >= 0 || y < oldChildren.length) {
			if (x >= 0) {
				oldVNode = oldChildren[x];
				if (oldVNode && key == oldVNode.key && type === oldVNode.type) {
					return x;
				}
				x--;
			}

			if (y < oldChildren.length) {
				oldVNode = oldChildren[y];
				if (oldVNode && key == oldVNode.key && type === oldVNode.type) {
					return y;
				}
				y++;
			}
		}
	}
}
