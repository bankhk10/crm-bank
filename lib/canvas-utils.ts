/**
 * Creates a new image from the given source URL.
 */
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); // needed to avoid cross-origin issues on CodeSandbox
    image.src = url;
  });

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function getRotatedRectToBeh(
  width: number,
  height: number,
  rotation: number
) {
  const rad = (rotation * Math.PI) / 180;
  return {
    w: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    h: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
}

/**
 * This function was adapted from the one in the ReadMe of https://github.com/DominicTobias/react-image-crop
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  flip = { horizontal: false, vertical: false },
  targetWidth?: number,
  targetHeight?: number
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const rotRad = (rotation * Math.PI) / 180;

  // calculate bounding box of the rotated image
  const { w: bBoxWidth, h: bBoxHeight } = getRotatedRectToBeh(
    image.width,
    image.height,
    rotation
  );

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // draw rotated image
  ctx.drawImage(image, 0, 0);

  // croppedAreaPixels values are bounding box relative
  // extract the cropped image using these values
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // If target dimensions are provided, we need to scale the result
  if (targetWidth && targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Create a temporary canvas to hold the unscaled cropped data
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = pixelCrop.width;
    tempCanvas.height = pixelCrop.height;
    const tempCtx = tempCanvas.getContext("2d");

    if (!tempCtx) {
      throw new Error("No temp context");
    }

    // Put the exact pixel data onto the temp canvas
    tempCtx.putImageData(data, 0, 0);

    // Draw the temp canvas onto the main canvas, scaling it to target dimensions
    // Use high quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      tempCanvas,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      targetWidth,
      targetHeight
    );
  } else {
    // No resizing needed
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.putImageData(data, 0, 0);
  }

  // As a blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      // resolve(URL.createObjectURL(file!));
      if (file) resolve(file);
      else reject(new Error("Canvas is empty"));
    }, "image/jpeg");
  });
}
