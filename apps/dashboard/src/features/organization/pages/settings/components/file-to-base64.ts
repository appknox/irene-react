/* Read in blocks, since spreading a whole file's bytes into one call overflows the stack. */
const CHUNK_SIZE = 8192;

/**
 * A file's bytes, base64-encoded.
 *
 * Used where an endpoint takes uploaded material in a JSON body rather than as
 * a multipart form, which is how the signing certificates are sent.
 *
 * @param file - The file to encode.
 * @returns Its bytes in base64.
 */
export async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());

  let binary = '';

  for (let at = 0; at < bytes.length; at += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(at, at + CHUNK_SIZE));
  }

  return btoa(binary);
}
