export function render(vnode, parentDom) {
	const newVNode = createElement(Fragment, null, [vnode]);

	diff(parentDom, newVNode);
}

export function diff(parentDom, newVNode) {
	if (newVNode.type === Fragment) {
		diffChildren(parentDom, newVNode.props.children);
	} else {
		// newVNode._dom = diffElementNodes(newVNode);
		const dom = diffElementNodes(newVNode);
		return dom;
	}
}

export function diffChildren(parentDom, childVNodes) {
	for (let childVNode of childVNodes) {
		if (childVNode == null || typeof childVNode == "boolean") {
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
