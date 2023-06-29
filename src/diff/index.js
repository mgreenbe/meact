import { Component, getDomSibling } from "../component";
import { Fragment } from "../create-element";
import { diffChildren } from "./children";
import { diffProps, setProperty } from "./props";

/**
 * Diff two virtual nodes and apply proper changes to the DOM
 * @param {import('../_internal').PreactElement} parentDom The parent of the DOM element
 * @param {import('../_internal').VNode} newVNode The new virtual node
 * @param {import('../_internal').VNode} oldVNode The old virtual node
 * @param {object} globalContext The current context object. Modified by getChildContext
 * @param {boolean} isSvg Whether or not this element is an SVG node
 * @param {Array<import('../_internal').PreactElement>} excessDomChildren
 * @param {Array<import('../_internal').Component>} commitQueue List of components
 * which have callbacks to invoke in commitRoot
 * @param {import('../_internal').PreactElement} oldDom The current attached DOM
 * element any new dom elements should be placed around. Likely `null` on first
 * render (except when hydrating). Can be a sibling DOM element when diffing
 * Fragments that have siblings. In most cases, it starts out as `oldChildren[0]._dom`.
 * @param {boolean} [isHydrating] Whether or not we are in hydration
 */
export function diff(
	parentDom,
	newVNode,
	oldVNode,
	_globalContext,
	_isSvg,
	_excessDomChildren,
	commitQueue,
	oldDom,
	_isHydrating
) {
	let tmp,
		newType = newVNode.type;

	outer: if (typeof newType == "function") {
		let c, isNew, oldProps, oldState, snapshot, clearProcessingException;
		let newProps = newVNode.props;

		// Get component and set it to `c`
		if (oldVNode._component) {
			c = newVNode._component = oldVNode._component;
			clearProcessingException = c._processingException = c._pendingError;
		} else {
			// Instantiate the new component
			if ("prototype" in newType && newType.prototype.render) {
				// @ts-ignore The check above verifies that newType is suppose to be constructed
				newVNode._component = c = new newType(newProps); // eslint-disable-line new-cap
			} else {
				// @ts-ignore Trust me, Component implements the interface we want
				newVNode._component = c = new Component(newProps);
				c.constructor = newType;
				c.render = doRender;
			}

			c.props = newProps;
			if (!c.state) c.state = {};
			isNew = c._dirty = true;
			c._renderCallbacks = [];
			c._stateCallbacks = [];
		}

		// Invoke getDerivedStateFromProps
		if (c._nextState == null) {
			c._nextState = c.state;
		}

		if (newType.getDerivedStateFromProps != null) {
			if (c._nextState == c.state) {
				c._nextState = { ...c._nextState };
			}

			Object.assign(
				c._nextState,
				newType.getDerivedStateFromProps(newProps, c._nextState)
			);
		}

		oldProps = c.props;
		oldState = c.state;
		c._vnode = newVNode;

		// Invoke pre-render lifecycle methods
		if (isNew) {
			if (
				newType.getDerivedStateFromProps == null &&
				c.componentWillMount != null
			) {
				c.componentWillMount();
			}

			if (c.componentDidMount != null) {
				c._renderCallbacks.push(c.componentDidMount);
			}
		} else {
			if (
				newType.getDerivedStateFromProps == null &&
				newProps !== oldProps &&
				c.componentWillReceiveProps != null
			) {
				c.componentWillReceiveProps(newProps);
			}

			if (
				!c._force &&
				((c.shouldComponentUpdate != null &&
					c.shouldComponentUpdate(newProps, c._nextState) === false) ||
					newVNode._original === oldVNode._original)
			) {
				// More info about this here: https://gist.github.com/JoviDeCroock/bec5f2ce93544d2e6070ef8e0036e4e8
				if (newVNode._original !== oldVNode._original) {
					// When we are dealing with a bail because of sCU we have to update
					// the props, state and dirty-state.
					// when we are dealing with strict-equality we don't as the child could still
					// be dirtied see #3883
					c.props = newProps;
					c.state = c._nextState;
					c._dirty = false;
				}

				newVNode._dom = oldVNode._dom;
				newVNode._children = oldVNode._children;
				newVNode._children.forEach((vnode) => {
					if (vnode) vnode._parent = newVNode;
				});

				for (let i = 0; i < c._stateCallbacks.length; i++) {
					c._renderCallbacks.push(c._stateCallbacks[i]);
				}
				c._stateCallbacks = [];

				if (c._renderCallbacks.length) {
					commitQueue.push(c);
				}

				break outer;
			}

			if (c.componentWillUpdate != null) {
				c.componentWillUpdate(newProps, c._nextState);
			}

			if (c.componentDidUpdate != null) {
				c._renderCallbacks.push(() => {
					c.componentDidUpdate(oldProps, oldState, snapshot);
				});
			}
		}

		c.props = newProps;
		c._parentDom = parentDom;
		c._force = false;

		let count = 0;
		if ("prototype" in newType && newType.prototype.render) {
			c.state = c._nextState;
			c._dirty = false;

			tmp = c.render(c.props, c.state);

			for (let i = 0; i < c._stateCallbacks.length; i++) {
				c._renderCallbacks.push(c._stateCallbacks[i]);
			}
			c._stateCallbacks = [];
		} else {
			do {
				c._dirty = false;

				tmp = c.render(c.props, c.state);

				// Handle setState called in render, see #2553
				c.state = c._nextState;
			} while (c._dirty && ++count < 25);
		}

		// Handle setState called in render, see #2553
		c.state = c._nextState;

		if (!isNew && c.getSnapshotBeforeUpdate != null) {
			snapshot = c.getSnapshotBeforeUpdate(oldProps, oldState);
		}

		let isTopLevelFragment =
			tmp != null && tmp.type === Fragment && tmp.key == null;
		let renderResult = isTopLevelFragment ? tmp.props.children : tmp;

		diffChildren(
			parentDom,
			Array.isArray(renderResult) ? renderResult : [renderResult],
			newVNode,
			oldVNode,
			undefined,
			undefined,
			undefined,
			commitQueue,
			oldDom,
			undefined
		);

		c.base = newVNode._dom;

		if (c._renderCallbacks.length) {
			commitQueue.push(c);
		}

		if (clearProcessingException) {
			c._pendingError = c._processingException = null;
		}
	} else if (newVNode._original === oldVNode._original) {
		newVNode._children = oldVNode._children;
		newVNode._dom = oldVNode._dom;
	} else {
		newVNode._dom = diffElementNodes(
			oldVNode._dom,
			newVNode,
			oldVNode,
			undefined,
			undefined,
			undefined,
			commitQueue,
			undefined
		);
	}
}

/**
 * @param {Array<import('../_internal').Component>} commitQueue List of components
 * which have callbacks to invoke in commitRoot
 * @param {import('../_internal').VNode} root
 */
export function commitRoot(commitQueue, root) {
	commitQueue.some((c) => {
		// @ts-ignore Reuse the commitQueue variable here so the type changes
		commitQueue = c._renderCallbacks;
		c._renderCallbacks = [];
		commitQueue.some((cb) => {
			// @ts-ignore See above ts-ignore on commitQueue
			cb.call(c);
		});
	});
}

/**
 * Diff two virtual nodes representing DOM element
 * @param {import('../_internal').PreactElement} dom The DOM element representing
 * the virtual nodes being diffed
 * @param {import('../_internal').VNode} newVNode The new virtual node
 * @param {import('../_internal').VNode} oldVNode The old virtual node
 * @param {object} globalContext The current context object
 * @param {boolean} isSvg Whether or not this DOM node is an SVG node
 * @param {*} excessDomChildren
 * @param {Array<import('../_internal').Component>} commitQueue List of components
 * which have callbacks to invoke in commitRoot
 * @param {boolean} isHydrating Whether or not we are in hydration
 * @returns {import('../_internal').PreactElement}
 */
function diffElementNodes(
	dom,
	newVNode,
	oldVNode,
	_globalContext,
	_isSvg,
	_excessDomChildren,
	commitQueue,
	_isHydrating
) {
	let oldProps = oldVNode.props;
	let newProps = newVNode.props;
	let nodeType = newVNode.type;
	let i = 0;

	// Tracks entering and exiting SVG namespace when descending through the tree.

	if (dom == null) {
		if (nodeType === null) {
			// @ts-ignore createTextNode returns Text, we expect PreactElement
			return document.createTextNode(newProps);
		}

		dom = document.createElement(
			// @ts-ignore We know `newVNode.type` is a string
			nodeType,
			newProps.is && newProps
		);
	}

	if (nodeType === null) {
		// During hydration, we still have to split merged text from SSR'd HTML.
		if (oldProps !== newProps && dom.data !== newProps) {
			dom.data = newProps;
		}
	} else {
		// If excessDomChildren was not null, repopulate it with the current element's children:
		oldProps = oldVNode.props || {};

		// During hydration, props are not diffed at all (including dangerouslySetInnerHTML)
		// @TODO we should warn in debug mode when props don't match here.
		// But, if we are in a situation where we are using existing DOM (e.g. replaceNode)
		// we should read the existing DOM attributes to diff them
		// if (newHtml || oldHtml) {
		// 	// Avoid re-applying the same '__html' if it did not changed between re-render
		// 	if (
		// 		!newHtml ||
		// 		((!oldHtml || newHtml.__html != oldHtml.__html) &&
		// 			newHtml.__html !== dom.innerHTML)
		// 	) {
		// 		dom.innerHTML = (newHtml && newHtml.__html) || "";
		// 	}
		// }

		diffProps(dom, newProps, oldProps, undefined, undefined);

		// If the new vnode didn't have dangerouslySetInnerHTML, diff its children

		i = newVNode.props.children;
		diffChildren(
			dom,
			Array.isArray(i) ? i : [i],
			newVNode,
			oldVNode,
			undefined,
			undefined,
			undefined,
			commitQueue,
			oldVNode._children && getDomSibling(oldVNode, 0),
			undefined
		);

		// (as above, don't diff props during hydration)
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

	return dom;
}

/**
 * Unmount a virtual node from the tree and apply DOM changes
 * @param {import('../_internal').VNode} vnode The virtual node to unmount
 * @param {import('../_internal').VNode} parentVNode The parent of the VNode that
 * initiated the unmount
 * @param {boolean} [skipRemove] Flag that indicates that a parent node of the
 * current element is already detached from the DOM.
 */
export function unmount(vnode, parentVNode, skipRemove) {
	let r;

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
		const parentNode = vnode._dom.parentNode;
		if (parentNode) {
			parentNode.removeChild(vnode._dom);
		}
	}

	// Must be set to `undefined` to properly clean up `_nextDom`
	// for which `null` is a valid value. See comment in `create-element.js`
	vnode._parent = vnode._dom = vnode._nextDom = undefined;
}

/** The `.render()` method for a PFC backing instance. */
function doRender(props, state, context) {
	return this.constructor(props, context);
}
