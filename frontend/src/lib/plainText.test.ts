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
});
