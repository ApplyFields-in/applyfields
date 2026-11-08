// Resume parsing happens on the API (apps/api/src/modules/users/resume-parser.ts).

/**
 * Encodes a browser File into a base64 Data URL for server-side processing & storage.
 */
export async function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
