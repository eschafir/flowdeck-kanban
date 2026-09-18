import { describe, expect, it } from "vitest";
import { normalizeUrl } from "./urlUtils";

describe("normalizeUrl", () => {
  it("keeps http(s) URLs and prefixes bare hosts", () => {
    expect(normalizeUrl("https://example.com/a")).toBe("https://example.com/a");
    expect(normalizeUrl(" http://example.com ")).toBe("http://example.com");
    expect(normalizeUrl("example.com/path")).toBe("https://example.com/path");
    expect(normalizeUrl("localhost:3000")).toBe("https://localhost:3000");
  });

  it("rejects empty and script-like input", () => {
    expect(normalizeUrl("")).toBeNull();
    expect(normalizeUrl("   ")).toBeNull();
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeUrl("JavaScript:alert(1)")).toBeNull();
    expect(normalizeUrl("data:text/html,<b>x</b>")).toBeNull();
  });

  it("only allows mailto and data images when asked", () => {
    expect(normalizeUrl("mailto:a@b.co")).toBeNull();
    expect(normalizeUrl("mailto:a@b.co", { allowMailto: true })).toBe(
      "mailto:a@b.co"
    );
    expect(normalizeUrl("data:image/png;base64,AAA")).toBeNull();
    expect(
      normalizeUrl("data:image/png;base64,AAA", { allowDataImage: true })
    ).toBe("data:image/png;base64,AAA");
  });
});
