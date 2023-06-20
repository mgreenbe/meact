// import { render, h } from "/src/index.js";
import {
	createElement,
	createElement as h,
	Fragment,
	createVNode,
} from "/src/create-element.js";
import { Component } from "/src/component.js";

const EMPTY_OBJ = {};

const parentDom = document.getElementById("meact-parent-dom");
// const vnode = h("p", {}, "Yo, dude!");

const vnode = h(Fragment, {}, [
	h("nav", {}, [h("a", { href: "/" }, "Home"), h("hr")]),
	h(
		"article",
		{},
		"Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit..."
	),
	h("footer", {}, [h("hr"), h("p", {}, h("i", {}, "(c) Me 2023"))]),
]);

render(vnode, parentDom);

export function render(vnode, parentDom) {
	let oldVNode = parentDom._children;

	vnode = parentDom._children = createElement(Fragment, null, [vnode]);

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

export function diff(parentDom, newVNode, oldVNode, excessDomChildren, oldDom) {
	const newType = newVNode.type;
	let tmp;

	if (typeof newType == "function") {
		let c, isNew, oldProps;
		let newProps = newVNode.props;

		if (oldVNode._component) {
			// todo
		} else {
			// Instantiate the new component
			if ("prototype" in newType && newType.prototype.render) {
				newVNode._component = c = new newType(newProps);
			} else {
				newVNode._component = c = new Component(newProps);
				c.constructor = newType;
				c.render = doRender;
			}

			c.props = newProps;
			isNew = c._dirty = true;

			oldProps = c.props;
			c._vnode = newVNode;

			if (isNew) {
				// c.componentWillMount
			} else {
				// component update hooks
			}

			c.props = newProps;
			c._parentDom = parentDom;

			tmp = c.render(c.props);

			let isTopLevelFragment =
				tmp != null && tmp.type === Fragment && tmp.key == null;
			let renderResult = isTopLevelFragment ? tmp.props.children : tmp;

			diffChildren(
				parentDom,
				Array.isArray(renderResult) ? renderResult : [renderResult],
				newVNode,
				oldVNode,
				excessDomChildren,
				oldDom
			);
		}
	} else if (
		excessDomChildren == null &&
		newVNode._original === oldVNode._original
	) {
		newVNode._children = oldVNode._children;
		newVNode._dom = oldVNode._dom;
	} else {
		newVNode._dom = diffElementNodes(
			oldVNode._dom,
			newVNode,
			oldVNode,
			excessDomChildren
		);
	}
}

export function diffChildren(
	parentDom,
	renderResult,
	newParentVNode,
	oldParentVNode,
	excessDomChildren,
	oldDom
) {
	let i,
		j,
		oldVNode,
		childVNode,
		newDom,
		firstChildDom,
		refs,
		skew = 0;

	// This is a compression of oldParentVNode!=null && oldParentVNode != EMPTY_OBJ && oldParentVNode._children || EMPTY_ARR
	// as EMPTY_OBJ._children should be `undefined`.
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
		} else if (childVNode._depth > 0) {
			// VNode is already in use, clone it. This can happen in the following
			// scenario:
			//   const reuse = <div />
			//   <div>{reuse}<span />{reuse}</div>
			childVNode = newParentVNode._children[i] = createVNode(
				childVNode.type,
				childVNode.props,
				childVNode.key,
				childVNode.ref ? childVNode.ref : null,
				childVNode._original
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
		childVNode._depth = newParentVNode._depth + 1;

		let skewedIndex = i + skew;

		const matchingIndex = findMatchingIndex(
			childVNode,
			oldChildren,
			skewedIndex,
			remainingOldChildren
		);

		if (matchingIndex === -1) {
			oldVNode = EMPTY_OBJ;
		} else {
			oldVNode = oldChildren[matchingIndex] || EMPTY_OBJ;
			oldChildren[matchingIndex] = undefined;
			remainingOldChildren--;
		}

		// Morph the old element into the new one, but don't append it to the dom yet
		diff(parentDom, childVNode, oldVNode, excessDomChildren, oldDom);

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

			let isMounting = oldVNode === EMPTY_OBJ || oldVNode._original === null;
			let hasMatchingIndex = !isMounting && matchingIndex === skewedIndex;
			if (isMounting) {
				if (matchingIndex == -1) {
					skew--;
				}
			} else if (matchingIndex !== skewedIndex) {
				if (matchingIndex === skewedIndex + 1) {
					skew++;
					hasMatchingIndex = true;
				} else if (matchingIndex > skewedIndex) {
					if (remainingOldChildren > newChildrenLength - skewedIndex) {
						skew += matchingIndex - skewedIndex;
						hasMatchingIndex = true;
					} else {
						// ### Change from keyed: I think this was missing from the algo...
						skew--;
					}
				} else if (matchingIndex < skewedIndex) {
					if (matchingIndex == skewedIndex - 1) {
						skew = matchingIndex - skewedIndex;
					} else {
						skew = 0;
					}
				} else {
					skew = 0;
				}
			}

			skewedIndex = i + skew;
			hasMatchingIndex =
				hasMatchingIndex || (matchingIndex == i && !isMounting);

			if (
				typeof childVNode.type == "function" &&
				(matchingIndex !== skewedIndex ||
					oldVNode._children === childVNode._children)
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

	// Set refs only after unmount
	if (refs) {
		for (i = 0; i < refs.length; i++) {
			applyRef(refs[i], refs[++i], refs[++i]);
		}
	}
}

/** The `.render()` method for a PFC backing instance. */
function doRender(props) {
	return this.constructor(props);
}

function findMatchingIndex(
	childVNode,
	oldChildren,
	skewedIndex,
	remainingOldChildren
) {
	const key = childVNode.key;
	const type = childVNode.type;
	let x = skewedIndex - 1;
	let y = skewedIndex + 1;
	let oldVNode = oldChildren[skewedIndex];

	if (
		oldVNode === null ||
		(oldVNode && key == oldVNode.key && type === oldVNode.type)
	) {
		return skewedIndex;
	} else if (remainingOldChildren > (oldVNode != null ? 1 : 0)) {
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

	return -1;
}

function diffElementNodes(dom, newVNode, oldVNode, excessDomChildren) {
	let isHydrating = false;

	let oldProps = oldVNode.props;
	let newProps = newVNode.props;
	let nodeType = newVNode.type;
	let i = 0;

	// Tracks entering and exiting SVG namespace when descending through the tree.

	if (excessDomChildren != null) {
		for (; i < excessDomChildren.length; i++) {
			const child = excessDomChildren[i];

			// if newVNode matches an element in excessDomChildren or the `dom`
			// argument matches an element in excessDomChildren, remove it from
			// excessDomChildren so it isn't later removed in diffChildren
			if (
				child &&
				"setAttribute" in child === !!nodeType &&
				(nodeType ? child.localName === nodeType : child.nodeType === 3)
			) {
				dom = child;
				excessDomChildren[i] = null;
				break;
			}
		}
	}

	if (dom == null) {
		if (nodeType === null) {
			return document.createTextNode(newProps);
		}

		dom = document.createElement(nodeType, newProps.is && newProps);

		// we created a new parent, so none of the previously attached children can be reused:
		excessDomChildren = null;
		// we are creating a new node, so we can assume this is a new subtree (in case we are hydrating), this deopts the hydrate
		isHydrating = false;
	}

	if (nodeType === null) {
		// During hydration, we still have to split merged text from SSR'd HTML.
		if (oldProps !== newProps && (!isHydrating || dom.data !== newProps)) {
			dom.data = newProps;
		}
	} else {
		// If excessDomChildren was not null, repopulate it with the current element's children:
		excessDomChildren = excessDomChildren && slice.call(dom.childNodes);

		oldProps = oldVNode.props || EMPTY_OBJ;

		let oldHtml = oldProps.dangerouslySetInnerHTML;
		let newHtml = newProps.dangerouslySetInnerHTML;

		// During hydration, props are not diffed at all (including dangerouslySetInnerHTML)
		// @TODO we should warn in debug mode when props don't match here.
		if (!isHydrating) {
			// But, if we are in a situation where we are using existing DOM (e.g. replaceNode)
			// we should read the existing DOM attributes to diff them
			if (excessDomChildren != null) {
				oldProps = {};
				for (i = 0; i < dom.attributes.length; i++) {
					oldProps[dom.attributes[i].name] = dom.attributes[i].value;
				}
			}

			if (newHtml || oldHtml) {
				// Avoid re-applying the same '__html' if it did not changed between re-render
				if (
					!newHtml ||
					((!oldHtml || newHtml.__html != oldHtml.__html) &&
						newHtml.__html !== dom.innerHTML)
				) {
					dom.innerHTML = (newHtml && newHtml.__html) || "";
				}
			}
		}

		diffProps(dom, newProps, oldProps);

		// If the new vnode didn't have dangerouslySetInnerHTML, diff its children
		if (newHtml) {
			newVNode._children = [];
		} else {
			i = newVNode.props.children;
			diffChildren(
				dom,
				Array.isArray(i) ? i : [i],
				newVNode,
				oldVNode,
				excessDomChildren,
				excessDomChildren
					? excessDomChildren[0]
					: oldVNode._children && getDomSibling(oldVNode, 0)
			);

			// Remove children that are not part of any vnode.
			if (excessDomChildren != null) {
				for (i = excessDomChildren.length; i--; ) {
					if (excessDomChildren[i] != null) removeNode(excessDomChildren[i]);
				}
			}
		}

		// (as above, don't diff props during hydration)
		if (!isHydrating) {
			if (
				"value" in newProps &&
				(i = newProps.value) !== undefined &&
				// #2756 For the <progress>-element the initial value is 0,
				// despite the attribute not being present. When the attribute
				// is missing the progress bar is treated as indeterminate.
				// To fix that we'll always update it when it is 0 for progress elements
				(i !== dom.value ||
					(nodeType === "progress" && !i) ||
					// This is only for IE 11 to fix <select> value not being updated.
					// To avoid a stale select value we need to set the option.value
					// again, which triggers IE11 to re-evaluate the select value
					(nodeType === "option" && i !== oldProps.value))
			) {
				setProperty(dom, "value", i, oldProps.value, false);
			}
			if (
				"checked" in newProps &&
				(i = newProps.checked) !== undefined &&
				i !== dom.checked
			) {
				setProperty(dom, "checked", i, oldProps.checked, false);
			}
		}
	}

	return dom;
}

export function diffProps(dom, newProps, oldProps) {
	let i;

	for (i in oldProps) {
		if (i !== "children" && i !== "key" && !(i in newProps)) {
			setProperty(dom, i, null, oldProps[i]);
		}
	}

	for (i in newProps) {
		if (
			// (!hydrate || typeof newProps[i] == "function") &&
			i !== "children" &&
			i !== "key" &&
			i !== "value" &&
			i !== "checked" &&
			oldProps[i] !== newProps[i]
		) {
			setProperty(dom, i, newProps[i], oldProps[i]);
		}
	}
}

export function setProperty(dom, name, value, oldValue) {
	let useCapture;

	o: if (name === "style") {
		if (typeof value == "string") {
			dom.style.cssText = value;
		} else {
			if (typeof oldValue == "string") {
				dom.style.cssText = oldValue = "";
			}

			if (oldValue) {
				for (name in oldValue) {
					if (!(value && name in value)) {
						setStyle(dom.style, name, "");
					}
				}
			}

			if (value) {
				for (name in value) {
					if (!oldValue || value[name] !== oldValue[name]) {
						setStyle(dom.style, name, value[name]);
					}
				}
			}
		}
	}
	// Benchmark for comparison: https://esbench.com/bench/574c954bdb965b9a00965ac6
	else if (name[0] === "o" && name[1] === "n") {
		useCapture = name !== (name = name.replace(/Capture$/, ""));

		// Infer correct casing for DOM built-in events:
		if (name.toLowerCase() in dom) name = name.toLowerCase().slice(2);
		else name = name.slice(2);

		if (!dom._listeners) dom._listeners = {};
		dom._listeners[name + useCapture] = value;

		if (value) {
			if (!oldValue) {
				const handler = useCapture ? eventProxyCapture : eventProxy;
				dom.addEventListener(name, handler, useCapture);
			}
		} else {
			const handler = useCapture ? eventProxyCapture : eventProxy;
			dom.removeEventListener(name, handler, useCapture);
		}
	} else if (name !== "dangerouslySetInnerHTML") {
		if (
			name !== "width" &&
			name !== "height" &&
			name !== "href" &&
			name !== "list" &&
			name !== "form" &&
			// Default value in browsers is `-1` and an empty string is
			// cast to `0` instead
			name !== "tabIndex" &&
			name !== "download" &&
			name !== "rowSpan" &&
			name !== "colSpan" &&
			name in dom
		) {
			try {
				dom[name] = value == null ? "" : value;
				// labelled break is 1b smaller here than a return statement (sorry)
				break o;
			} catch (e) {}
		}

		// aria- and data- attributes have no boolean representation.
		// A `false` value is different from the attribute not being
		// present, so we can't remove it. For non-boolean aria
		// attributes we could treat false as a removal, but the
		// amount of exceptions would cost too many bytes. On top of
		// that other frameworks generally stringify `false`.

		if (typeof value === "function") {
			// never serialize functions as attribute values
		} else if (value != null && (value !== false || name[4] === "-")) {
			dom.setAttribute(name, value);
		} else {
			dom.removeAttribute(name);
		}
	}
}

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

function placeChild(parentDom, newDom, oldDom) {
	if (oldDom == null || oldDom.parentNode !== parentDom) {
		parentDom.insertBefore(newDom, null);
	} else if (newDom != oldDom || newDom.parentNode == null) {
		parentDom.insertBefore(newDom, oldDom);
	}

	return newDom.nextSibling;
}
