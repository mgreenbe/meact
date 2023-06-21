export function render(vnode, dParent) {
	const dom = diff(vnode);
	if (Array.isArray(dom)) {
		for (let dNode of dom) {
			dParent.appendChild(dNode);
		}
	} else if (dom != null) {
		dParent.appendChild(dom);
	}
}

export function diff(vNode) {
	// debugger;
	if (vNode == null || typeof vNode === "boolean") {
		return null;
	} else if (typeof vNode === "string" || typeof vNode === "number") {
		const dNode = document.createTextNode(vNode);
		return dNode;
	} else if (vNode.type === Fragment) {
		const dNodes = diffChildren(vNode.props.children);
		return dNodes;
	} else if (typeof vNode.type === "string") {
		const dNode = diffElementNodes(vNode);
		return dNode;
	} else {
		throw new TypeError("Unknown species of vNode.");
	}
}

export function diffChildren(childVNodes) {
	const childDNodes = [];
	for (let childVNode of childVNodes) {
		if (childVNode == null || typeof childVNode == "boolean") {
			continue;
		} else if (
			typeof childVNode === "string" ||
			typeof childVNode === "number"
		) {
			const childDNode = document.createTextNode(childVNode);
			childDNodes.push(childDNode);
		} else {
			const childDNode = diff(childVNode);
			if (childDNode !== undefined) {
				childDNodes.push(childDNode);
			}
		}
	}
	return childDNodes.flat();
}

function diffElementNodes(vNode) {
	const dom = document.createElement(vNode.type);
	for (let [name, value] of Object.entries(vNode.props)) {
		if (name !== "children" && name in dom) {
			dom[name] = value;
		}
	}
	const children = diffChildren(vNode.props.children);
	for (let child of children) {
		dom.appendChild(child);
	}
	return dom;
}

export function createElement(type, props = {}, ...children) {
	return { type, props: { ...props, children: children.flat() } };
}

export function Fragment(props) {
	return props.children;
}
