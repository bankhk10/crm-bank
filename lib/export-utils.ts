/**
 * Client-side utility for triggering browser file downloads from base64 strings
 */

export function downloadBase64File(
  base64: string,
  filename: string,
  mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
): void {
  try {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Failed to download file:", err);
    throw err;
  }
}
