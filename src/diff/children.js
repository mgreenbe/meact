import { diff, unmount } from "./index";
import { createVNode } from "../create-element";

/**
 * Diff the children of a virtual node
 * @param {import('../internal').PreactElement} parentDom The DOM element whose
 * children are being diffed
 * @param {import('../internal').ComponentChildren[]} childVNodes
 * @param {import('../internal').VNode} newVNode The new virtual
 * node whose children should be diff'ed against oldVNode
 * @param {import('../internal').VNode} oldVNode The old virtual
 * node whose children should be diff'ed against newVNode
 * @param {import('../internal').PreactElement} oldDom The current attached DOM
 * element any new dom elements should be placed around. Likely `null` on first
 * render (except when hydrating). Can be a sibling DOM element when diffing
 * Fragments that have siblings. In most cases, it starts out as `oldChildren[0]._dom`.
 * @param {boolean} isHydrating Whether or not we are in hydration
 */
export function diffChildren(
	parentDom,
	childVNodes,
	newVNode,
	oldVNode,
	oldDom
) {
	const oldChildren = oldVNode._children || [];
	newVNode._children = [];
	for (let i = 0; i < childVNodes.length; i++) {
		let childVNode = childVNodes[i];

		// populate newVNode._children
		if (childVNode == null || typeof childVNode === "boolean") {
			continue;
		} else if (typeof childVNode == "string" || typeof childVNode == "number") {
			// turn it into a real vnode
			childVNode = createVNode(null, childVNode, null);
			newVNode._children[i] = childVNode;
		} else {
			newVNode._children[i] = childVNode;
		}

		const matchingIndex = findMatchingIndex(childVNode, oldChildren, i);
		// childVNode and (hence) newVNode.children[i] get populated with _dom
		diff(parentDom, childVNode, oldChildren[matchingIndex], oldDom);
		oldChildren[matchingIndex] = undefined;
		const newDom = childVNode._dom;
		if (newDom != null) {
			if (matchingIndex !== i + 1) {
				oldDom = placeChild(parentDom, newDom, oldDom);
			} else if (childVNode._nextDom === undefined) {
				oldDom = newDom.nextSibling;
			}
		}
	}

	// Remove remaining oldChildren if there are any.
	for (let i = oldChildren.length; i >= 0; i--) {
		if (oldChildren[i] != null) {
			unmount(oldChildren[i]);
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
