import "@testing-library/jest-dom";
import { render } from "./meact.js";

test("renders text into a container", () => {
	const container = document.createElement("div");
	render("Hello, world!", container);
	expect(container.textContent).toBe("Hello, world!");
});
