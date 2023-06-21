export function render(vnode, parentDom) {
	const newDom = diff(parentDom, vnode);
	if (newDom != null) {
		parentDom.appendChild(newDom);
	}
}

export function diff(parentDom, newVNode) {
	debugger;
	if (newVNode == null || typeof newVNode === "boolean") {
		return null;
	} else if (typeof newVNode === "string" || typeof newVNode === "number") {
		const newDNode = document.createTextNode(newVNode);
		return newDNode;
	} else if (newVNode.type === Fragment) {
		diffChildren(parentDom, newVNode.props.children);
	} else if (typeof newVNode.type === "string") {
		const newDNode = diffElementNodes(newVNode);
		return newDNode;
	} else {
		throw new TypeError("Unknown species of vNode.");
	}
}

export function diffChildren(parentDom, childVNodes) {
	for (let childVNode of childVNodes) {
		if (childVNode == null || typeof childVNode == "boolean") {
			// null goes here
			continue;
		} else if (
			typeof childVNode === "string" ||
			typeof childVNode === "number"
		) {
			const newDom = document.createTextNode(childVNode);
			parentDom.insertBefore(newDom, null);
			continue;
		}
		const dom = diff(parentDom, childVNode, {});
		if (childVNode.type !== Fragment) {
			parentDom.insertBefore(dom, null);
		}
	}
}

function diffElementNodes(newVNode) {
	console.assert(newVNode != null);
	console.assert(typeof newVNode.type != "function");
	const dom = document.createElement(newVNode.type);
	// diffProps
	for (let [name, value] of Object.entries(newVNode.props)) {
		// setProperty
		if (name !== "children" && name in dom) {
			dom[name] = value;
		}
	}
	diffChildren(dom, newVNode.props.children, newVNode);
	return dom;
}

export function createElement(type, props = {}, ...children) {
	return createVNode(type, { ...props, children: children.flat() });
}

export function createVNode(type, props) {
	return {
		type,
		props,
	};
}

export function Fragment(props) {
	return props.children;
}
