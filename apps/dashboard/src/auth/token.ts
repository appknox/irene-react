/** Base64 a string containing characters above latin1, which btoa rejects. */
export function b64EncodeUnicode(value: string): string {
  const utf8Bytes = new TextEncoder().encode(value);

  let latin1 = '';

  for (const byte of utf8Bytes) {
    latin1 += String.fromCharCode(byte);
  }

  return btoa(latin1);
}

export const getB64Token = (userId: number, token: string): string =>
  b64EncodeUnicode(`${userId}:${token}`);
