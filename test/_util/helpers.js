import { createElement, options } from "preact";
import { clearLog, getLog } from "./logCall";
import { teardown as testUtilTeardown } from "preact/test-utils";

function normalizePath(str) {
	let len = str.length;
	let out = "";
	for (let i = 0; i < len; i++) {
		const char = str[i];
		if (/[A-Za-z]/.test(char)) {
			if (i == 0) out += char + " ";
			else
				out += (str[i - 1] == " " ? "" : " ") + char + (i < len - 1 ? " " : "");
		} else if (char == "-" && str[i - 1] !== " ") out += " " + char;
		else out += char;
	}

	return out.replace(/\s\s+/g, " ").replace(/z/g, "Z");
}

export function serializeHtml(node) {
	let str = "";
	let child = node.firstChild;
	while (child) {
		str += serializeDomTree(child);
		child = child.nextSibling;
	}
	return str;
}

/**
 * Serialize a DOM tree.
 * Uses deterministic sorting where necessary to ensure consistent tests.
 * @param {Element|Node} node	The root node to serialize
 * @returns {string} html
 */
function serializeDomTree(node) {
	if (node.nodeType === 3) {
		return encodeEntities(node.data);
	} else if (node.nodeType === 8) {
		return "<!--" + encodeEntities(node.data) + "-->";
	} else if (node.nodeType === 1 || node.nodeType === 9) {
		let str = "<" + node.localName;
		const attrs = [];
		for (let i = 0; i < node.attributes.length; i++) {
			attrs.push(node.attributes[i].name);
		}
		attrs.sort();
		for (let i = 0; i < attrs.length; i++) {
			const name = attrs[i];
			let value = node.getAttribute(name);

			// don't render attributes with null or undefined values
			if (value == null) continue;

			// normalize empty class attribute
			if (!value && name === "class") continue;

			str += " " + name;
			value = encodeEntities(value);

			// normalize svg <path d="value">
			if (node.localName === "path" && name === "d") {
				value = normalizePath(value);
			}
			str += '="' + value + '"';
		}
		str += ">";

		// For elements that don't have children (e.g. <wbr />) don't descend.
		if (!VOID_ELEMENTS.test(node.localName)) {
			// IE puts the value of a textarea as its children while other browsers don't.
			// Normalize those differences by forcing textarea to not have children.
			if (node.localName != "textarea") {
				let child = node.firstChild;
				while (child) {
					str += serializeDomTree(child);
					child = child.nextSibling;
				}
			}

			str += "</" + node.localName + ">";
		}
		return str;
	}
}
