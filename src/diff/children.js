import { diff, unmount } from "./index";
import { createVNode, Fragment } from "../create-element";

/**
 * Diff the children of a virtual node
 * @param {import('../_internal').PreactElement} parentDom The DOM element whose
 * children are being diffed
 * @param {import('../_internal').ComponentChildren[]} renderResult
 * @param {import('../_internal').VNode} newParentVNode The new virtual
 * node whose children should be diff'ed against oldParentVNode
 * @param {import('../_internal').VNode} oldParentVNode The old virtual
 * node whose children should be diff'ed against newParentVNode
 * @param {object} globalContext The current context object - modified by getChildContext
 * @param {boolean} isSvg Whether or not this DOM node is an SVG node
 * @param {Array<import('../_internal').PreactElement>} excessDomChildren
 * @param {Array<import('../_internal').Component>} commitQueue List of components
 * which have callbacks to invoke in commitRoot
 * @param {import('../_internal').PreactElement} oldDom The current attached DOM
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
	_globalContext,
	_isSvg,
	_excessDomChildren,
	commitQueue,
	oldDom,
	_isHydrating
) {
	let i, j, oldVNode, childVNode, newDom, firstChildDom, refs;

	// This is a compression of oldParentVNode!=null && oldParentVNode != {} && oldParentVNode._children || []
	// as {}._children should be `undefined`.
	let oldChildren = (oldParentVNode && oldParentVNode._children) || [];

	let oldChildrenLength = oldChildren.length,
		remainingOldChildren = oldChildrenLength,
		newChildrenLength = renderResult.length;

	newParentVNode._children = [];
	for (i = 0; i < newChildrenLength; i++) {
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
		else if (
			typeof childVNode == "string" ||
			typeof childVNode == "number" ||
			// eslint-disable-next-line valid-typeof
			typeof childVNode == "bigint"
		) {
			childVNode = newParentVNode._children[i] = createVNode(
				null,
				childVNode,
				null,
				null,
				childVNode
			);
		} else if (Array.isArray(childVNode)) {
			childVNode = newParentVNode._children[i] = createVNode(
				Fragment,
				{ children: childVNode },
				null,
				null,
				null
			);
		} else {
			childVNode = newParentVNode._children[i] = childVNode;
		}

		// Terser removes the `continue` here and wraps the loop body
		// in a `if (childVNode) { ... } condition
		if (childVNode == null) {
			continue;
		}

		childVNode._parent = newParentVNode;

		const matchingIndex = findMatchingIndex(
			childVNode,
			oldChildren,
			undefined,
			remainingOldChildren
		);

		if (matchingIndex === -1) {
			oldVNode = {};
		} else {
			oldVNode = oldChildren[matchingIndex] || {};
			oldChildren[matchingIndex] = undefined;
			remainingOldChildren--;
		}

		// Morph the old element into the new one, but don't append it to the dom yet
		diff(
			parentDom,
			childVNode,
			oldVNode,
			undefined,
			undefined,
			undefined,
			commitQueue,
			oldDom,
			undefined
		);

		newDom = childVNode._dom;

		if ((j = childVNode.ref) && oldVNode.ref != j) {
			if (!refs) refs = [];
			if (oldVNode.ref) refs.push(oldVNode.ref, null, childVNode);
			refs.push(j, childVNode._component || newDom, childVNode);
		}

		if (newDom != null) {
			if (firstChildDom == null) {
				firstChildDom = newDom;
			}

			let isMounting = oldVNode === {} || oldVNode._original === null;
			let hasMatchingIndex = !isMounting && matchingIndex === i;
			if (matchingIndex !== i) {
				if (matchingIndex === i + 1) {
					hasMatchingIndex = true;
				} else if (matchingIndex > i) {
					if (remainingOldChildren > newChildrenLength) {
						hasMatchingIndex = true;
					}
				}
			}

			hasMatchingIndex =
				hasMatchingIndex || (matchingIndex == i && !isMounting);

			if (
				typeof childVNode.type == "function" &&
				oldVNode._children === childVNode._children
			) {
				oldDom = reorderChildren(childVNode, oldDom, parentDom);
			} else if (typeof childVNode.type != "function" && !hasMatchingIndex) {
				oldDom = placeChild(parentDom, newDom, oldDom);
			} else if (childVNode._nextDom !== undefined) {
				// Only Fragments or components that return Fragment like VNodes will
				// have a non-undefined _nextDom. Continue the diff from the sibling
				// of last DOM child of this child VNode
				oldDom = childVNode._nextDom;

				// Eagerly cleanup _nextDom. We don't need to persist the value because
				// it is only used by `diffChildren` to determine where to resume the diff after
				// diffing Components and Fragments. Once we store it the nextDOM local var, we
				// can clean up the property
				childVNode._nextDom = undefined;
			} else {
				oldDom = newDom.nextSibling;
			}

			if (typeof newParentVNode.type == "function") {
				// Because the newParentVNode is Fragment-like, we need to set it's
				// _nextDom property to the nextSibling of its last child DOM node.
				//
				// `oldDom` contains the correct value here because if the last child
				// is a Fragment-like, then oldDom has already been set to that child's _nextDom.
				// If the last child is a DOM VNode, then oldDom will be set to that DOM
				// node's nextSibling.
				newParentVNode._nextDom = oldDom;
			}
		}
	}

	newParentVNode._dom = firstChildDom;

	// Remove remaining oldChildren if there are any.
	for (i = oldChildrenLength; i--; ) {
		if (oldChildren[i] != null) {
			if (
				typeof newParentVNode.type == "function" &&
				oldChildren[i]._dom != null &&
				oldChildren[i]._dom == newParentVNode._nextDom
			) {
				// If the newParentVNode.__nextDom points to a dom node that is about to
				// be unmounted, then get the next sibling of that vnode and set
				// _nextDom to it

				newParentVNode._nextDom = oldChildren[i]._dom.nextSibling;
			}

			unmount(oldChildren[i], oldChildren[i]);
		}
	}
}

function reorderChildren(childVNode, oldDom, parentDom) {
	// Note: VNodes in nested suspended trees may be missing _children.
	let c = childVNode._children;

	let tmp = 0;
	for (; c && tmp < c.length; tmp++) {
		let vnode = c[tmp];
		if (vnode) {
			// We typically enter this code path on sCU bailout, where we copy
			// oldVNode._children to newVNode._children. If that is the case, we need
			// to update the old children's _parent pointer to point to the newVNode
			// (childVNode here).
			vnode._parent = childVNode;

			if (typeof vnode.type == "function") {
				oldDom = reorderChildren(vnode, oldDom, parentDom);
			} else {
				oldDom = placeChild(parentDom, vnode._dom, oldDom);
			}
		}
	}

	return oldDom;
}

/**
 * Flatten and loop through the children of a virtual node
 * @param {import('../index').ComponentChildren} children The unflattened
 * children of a virtual node
 * @returns {import('../_internal').VNode[]}
 */
export function toChildArray(children, out) {
	out = out || [];
	if (children == null || typeof children == "boolean") {
	} else if (Array.isArray(children)) {
		children.some((child) => {
			toChildArray(child, out);
		});
	} else {
		out.push(children);
	}
	return out;
}

function placeChild(parentDom, newDom, oldDom) {
	if (oldDom == null || oldDom.parentNode !== parentDom) {
		parentDom.insertBefore(newDom, null);
	} else if (newDom != oldDom || newDom.parentNode == null) {
		parentDom.insertBefore(newDom, oldDom);
	}

	return newDom.nextSibling;
}

/**
 * @param {import('../_internal').VNode | string} childVNode
 * @param {import('../_internal').VNode[]} oldChildren
 * @param {number} skewedIndex
 * @param {number} remainingOldChildren
 * @returns {number}
 */
function findMatchingIndex(
	childVNode,
	oldChildren,
	_skewedIndex,
	remainingOldChildren
) {
	const key = childVNode.key;
	const type = childVNode.type;
	let oldVNode = oldChildren[0];

	if (
		oldVNode === null ||
		(oldVNode && key == oldVNode.key && type === oldVNode.type)
	) {
		return 0;
	} else if (remainingOldChildren > (oldVNode != null ? 1 : 0)) {
		let y = 1;
		while (y < oldChildren.length) {
			if (y < oldChildren.length) {
				oldVNode = oldChildren[y];
				if (oldVNode && key == oldVNode.key && type === oldVNode.type) {
					return y;
				}
				y++;
			}
		}
	}

	return -1;
}
