import { render, h, Fragment } from "/src/index.js";

console.log("~~~~~~\nPreact\n~~~~~~");
const parentDom = document.getElementById("preact-parent-dom");

const objDefaults = {
	addedNodes: new Set([]),
	removedNodes: new Set([]),
	oldValue: null,
	attributeName: null,
};

const observeConfig = {
	characterData: true,
	characterDataOldValue: true,
	attributes: true,
	childList: true,
	attributeOldValue: true,
	subtree: true,
};

function rec2Obj(x) {
	const obj = {
		type: x.type,
		addedNodes: new Set(Array.from(x.addedNodes).map((x) => x.outerHTML)),
		removedNodes: new Set(Array.from(x.removedNodes).map((x) => x.outerHTML)),
		target: x.target instanceof Text ? x.target.data : x.target.outerHTML,
		oldValue: x.oldValue,
		attributeName: x.attributeName,
	};
	return obj;
}

render("Old Text", parentDom);

let observer = new MutationObserver((x) => {
	const y = x.map(rec2Obj);
	console.assert(x.length == 1);
	const record = x[0];
	console.log(record);
	console.assert(record.type === "characterData");
	console.assert(record.target instanceof Text);
	console.assert(record.oldValue === "Old Text");
});
observer.observe(parentDom, observeConfig);

// render("New Text", parentDom);
