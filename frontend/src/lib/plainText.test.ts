import { describe, expect, it } from "vitest";
import { htmlToPlainText } from "./plainText";

describe("htmlToPlainText", () => {
  it("returns plain text unchanged", () => {
    expect(htmlToPlainText("Hello world")).toBe("Hello world");
  });

  it("strips tags and collapses whitespace", () => {
    expect(htmlToPlainText("<p><strong>Bold</strong> and <em>italic</em></p>")).toBe(
      "Bold and italic"
    );
  });

  it("handles empty input", () => {
    expect(htmlToPlainText("")).toBe("");
  });

  it("drops images, links and styling but keeps the words", () => {
    const html =
      '<h2>Plan</h2><p>See <a href="https://example.com">the doc</a> <span style="font-size: 18px">now</span></p>' +
      '<img src="data:image/png;base64,AAAA"><ul><li>One</li><li>Two</li></ul>';
    expect(htmlToPlainText(html)).toBe("Plan See the doc now One Two");
  });
});
