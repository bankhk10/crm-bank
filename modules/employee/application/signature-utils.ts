import { uploadFile } from "@/lib/file-storage";

/**
 * Handle signature upload.
 * If the signature is a Base64 string, upload it as a file and return the URL.
 * If it's already a URL or empty, return it as is.
 */
export async function handleSignatureUpload(signature?: string | null): Promise<string | undefined> {
  if (!signature) return undefined;

  // Check if it's a Base64 string
  if (signature.startsWith("data:image/")) {
    try {
      const match = signature.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) return signature;

      const [, mimeType, base64Data] = match;
      const buffer = Buffer.from(base64Data, "base64");
      
      // We can use 'employees/signatures' as the folder
      // The uploadFile function will generate a unique filename
      const extension = mimeType.split("/")[1] || "png";
      const originalName = `signature.${extension}`;

      const uploadResult = await uploadFile(buffer, originalName, {
        folder: "employees/signatures",
      });

      return uploadResult.url;
    } catch (error) {
      console.error("Error uploading signature file:", error);
      // Fallback to Base64 if upload fails, though ideally we should handle this
      return signature;
    }
  }

  return signature;
}
