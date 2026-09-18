import { describe, expect, it } from "vitest";
import { fileToDataUrl, fitWithin, isImageFile } from "./imageUtils";

describe("fitWithin", () => {
  it("leaves images within the limit untouched", () => {
    expect(fitWithin(800, 600, 1200)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(1200, 1200, 1200)).toEqual({ width: 1200, height: 1200 });
  });

  it("scales the longest edge down, keeping the aspect ratio", () => {
    expect(fitWithin(2400, 1200, 1200)).toEqual({ width: 1200, height: 600 });
    expect(fitWithin(1000, 3000, 1200)).toEqual({ width: 400, height: 1200 });
  });

  it("never returns a zero dimension", () => {
    expect(fitWithin(10000, 1, 1200).height).toBe(1);
  });
});

describe("fileToDataUrl", () => {
  it("recognises image files", () => {
    expect(isImageFile(new File([""], "a.png", { type: "image/png" }))).toBe(
      true
    );
    expect(isImageFile(new File([""], "a.txt", { type: "text/plain" }))).toBe(
      false
    );
  });

  it("rejects non-images", async () => {
    const file = new File(["hi"], "a.txt", { type: "text/plain" });
    await expect(fileToDataUrl(file)).rejects.toThrow("not an image");
  });

  it("embeds small SVGs as-is", async () => {
    const file = new File(["<svg xmlns='http://www.w3.org/2000/svg'/>"], "a.svg", {
      type: "image/svg+xml",
    });
    await expect(fileToDataUrl(file)).resolves.toMatch(
      /^data:image\/svg\+xml/
    );
  });

  it("rejects oversized files", async () => {
    const big = new File([new Uint8Array(11 * 1024 * 1024)], "b.png", {
      type: "image/png",
    });
    await expect(fileToDataUrl(big)).rejects.toThrow("too large");
  });
});
