/**
 * The text of a server message sent as HTML. irene renders it `htmlSafe`; here it
 * is parsed into a detached document so none of its markup reaches the page.
 */
export function serverMarkupAsText(html: string) {
  return new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '';
}
