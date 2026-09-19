/**
 * Image handling for rendered emails: remote-image blocking (privacy-first
 * default) and CID inline-image rewriting.
 *
 * Remote images are replaced with a placeholder carrying the original URL in
 * `data-remote-src`; the reading pane swaps them back when the user clicks
 * "Load images" (see thread view).
 */

const REMOTE_IMG = /<img([^>]*?)\ssrc=(["'])(https?:\/\/[^"']+)\2([^>]*)>/gi

/**
 * Replace remote <img> sources with an inert placeholder. Returns the
 * rewritten HTML plus the list of blocked URLs.
 */
export function blockRemoteImages(html: string): {
  html: string
  blocked: string[]
} {
  const blocked: string[] = []
  const out = html.replace(
    REMOTE_IMG,
    (_match, pre: string, _q: string, url: string, post: string) => {
      blocked.push(url)
      return `<span data-remote-image="blocked" data-remote-src="${escapeAttr(
        url
      )}"${attrsWithoutSrc(pre + post)}></span>`
    }
  )
  return { html: out, blocked }
}

/** Restore previously blocked remote images (user clicked "Load images"). */
export function allowRemoteImages(html: string): string {
  return html.replace(
    /<span data-remote-image="blocked" data-remote-src=(["'])(.*?)\1([^>]*)><\/span>/gi,
    (_match, _q: string, url: string, post: string) =>
      `<img src="${url}"${post} loading="lazy" />`
  )
}

/**
 * Rewrite `cid:` image sources through a resolver (blobId → object URL).
 * `resolver` maps a Content-ID to a displayable URL; unresolved CIDs are
 * left untouched.
 */
export function rewriteCidImages(
  html: string,
  resolver: (contentId: string) => string | undefined
): string {
  return html.replace(
    /<img([^>]*?)\ssrc=(["'])cid:([^"']+)\2([^>]*)>/gi,
    (match, pre: string, q: string, cid: string, post: string) => {
      const url = resolver(cid)
      return url ? `<img${pre} src=${q}${url}${q}${post}>` : match
    }
  )
}

function attrsWithoutSrc(attrs: string): string {
  // Keep sizing/alt attributes on the placeholder for layout stability.
  return attrs
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;")
}
