import { IS_NON_DIMENSIONAL } from "../constants";

/**
 * Diff the old and new properties of a VNode and apply changes to the DOM node
 * @param {import('../internal').PreactElement} dom The DOM node to apply
 * changes to
 * @param {object} newProps The new props
 * @param {object} oldProps The old props
 */
export function diffProps(dom, newProps, oldProps) {
	for (let i in oldProps) {
		if (i !== "children" && i !== "key" && !(i in newProps)) {
			setProperty(dom, i, null);
		}
	}

	for (let i in newProps) {
		if (i !== "children" && i !== "key" && oldProps[i] !== newProps[i]) {
			setProperty(dom, i, newProps[i]);
		}
	}
}

/**
 * Set a property value on a DOM node
 * @param {import('../internal').PreactElement} dom The DOM node to modify
 * @param {string} name The name of the property to set
 * @param {*} value The value to set the property to
 */
export function setProperty(dom, name, value) {
	if (name in dom) {
		dom[name] = value == null ? "" : value;
	}
}
