import { createElement, Fragment, createVNode } from "./src/create-element.js";

export function render(vnode, parentDom) {
	const newVNode = (parentDom._children = createElement(Fragment, null, [
		vnode,
	]));

	diff(parentDom, newVNode);
}

export function diff(parentDom, newVNode) {
	if (newVNode.type === Fragment) {
		let renderResult = Array.isArray(newVNode.props.children)
			? newVNode.props.children
			: [newVNode.props.children];

		diffChildren(parentDom, renderResult, newVNode);
	} else {
		newVNode._dom = diffElementNodes(newVNode);
	}
}

export function diffChildren(parentDom, renderResult) {
	for (let childVNode of renderResult) {
		if (childVNode == null || typeof childVNode == "boolean") {
			continue;
		} else if (
			typeof childVNode === "string" ||
			typeof childVNode === "number"
		) {
			childVNode = createVNode(null, childVNode, null, null, childVNode);
		}

		diff(parentDom, childVNode, {});

		const newDom = childVNode._dom;
		if (newDom != null) {
			parentDom.insertBefore(newDom, null);
		}
	}
}

function diffElementNodes(newVNode) {
	const newProps = newVNode.props;
	const nodeType = newVNode.type;

	if (nodeType === null) {
		return document.createTextNode(newProps);
	}

	const dom = document.createElement(nodeType);

	// diffProps
	for (let [name, value] of Object.entries(newProps)) {
		// setProperty
		if (name !== "children" && name in dom) {
			dom[name] = value;
		}
	}

	const i = newVNode.props.children;
	diffChildren(dom, Array.isArray(i) ? i : [i], newVNode);

	return dom;
}
