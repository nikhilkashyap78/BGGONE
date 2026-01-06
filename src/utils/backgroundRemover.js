import { removeBackground as imglyRemoveBackground } from "@imgly/background-removal";

/**
 * Removes the background from an image.
 * @param {File | string} imageSource - The image file or URL to process.
 * @returns {Promise<Blob>} - A promise that resolves to the processed image Blob (PNG).
 */
export async function removeBackground(imageSource) {
  try {
    const blob = await imglyRemoveBackground(imageSource, {
      progress: (key, current, total) => {
        // Optional: Expose progress if needed
        // console.log(`Downloading ${key}: ${current} of ${total}`);
      },
      debug: false, // Set to true for debugging
      model_bundle: {
        // Can override model locations here if needed, but defaults work well for CDN
      }
    });
    return blob;
  } catch (error) {
    console.error("Background removal failed:", error);
    throw new Error("Failed to remove background. The image might be too complex or not supported.");
  }
}
