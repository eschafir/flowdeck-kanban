export const MAX_IMAGE_DIMENSION = 1200;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
/** Images already this small (and within the max dimension) are embedded untouched. */
const PASSTHROUGH_BYTES = 300 * 1024;
/** SVG/GIF can't be re-encoded through a canvas without losing vectors/animation. */
const RAW_ONLY_TYPES = new Set(["image/svg+xml", "image/gif"]);
const RAW_ONLY_MAX_BYTES = 500 * 1024;

export function fitWithin(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxDimension) return { width, height };
  const scale = maxDimension / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(blob);
  });
}

/**
 * Turns an image file into a data URL small enough to embed in the workspace.
 * Throws an Error whose message is safe to show to the user.
 */
export async function fileToDataUrl(file: File): Promise<string> {
  if (!isImageFile(file)) {
    throw new Error("That file is not an image.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large (10 MB max).");
  }

  if (RAW_ONLY_TYPES.has(file.type)) {
    if (file.size > RAW_ONLY_MAX_BYTES) {
      throw new Error(
        `${file.type === "image/gif" ? "GIF" : "SVG"} is too large to embed (500 KB max).`
      );
    }
    return readAsDataUrl(file);
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Could not read the image.");
  }

  try {
    const { width, height } = fitWithin(
      bitmap.width,
      bitmap.height,
      MAX_IMAGE_DIMENSION
    );
    const unchanged = width === bitmap.width && height === bitmap.height;
    if (unchanged && file.size <= PASSTHROUGH_BYTES) {
      return await readAsDataUrl(file);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return await readAsDataUrl(file);
    context.drawImage(bitmap, 0, 0, width, height);
    return canvas.toDataURL("image/webp", 0.85);
  } finally {
    bitmap.close();
  }
}
