/**
 * Quoted-content collapsing for the reading pane.
 *
 * Wraps trailing reply quotes (`<blockquote>`, `.gmail_quote`, Outlook's
 * `#divRplyFwdMsg`) in a collapsible container so long threads stay
 * scannable. DOM-only; returns the input unchanged without a DOM.
 */

const QUOTE_SELECTOR = "blockquote, .gmail_quote, #divRplyFwdMsg"

export function collapseQuotedSections(html: string): string {
  if (typeof DOMParser === "undefined") return html

  const doc = new DOMParser().parseFromString(html, "text/html")
  const quotes = doc.body.querySelectorAll(QUOTE_SELECTOR)
  if (quotes.length === 0) return html

  for (const quote of Array.from(quotes)) {
    // Don't nest toggles inside already-collapsed quotes.
    if (quote.closest("[data-quote-collapsed]")) continue
    const wrapper = doc.createElement("details")
    wrapper.setAttribute("data-quote-collapsed", "true")
    wrapper.style.cssText = "margin-top:4px"
    const summary = doc.createElement("summary")
    summary.textContent = "•••"
    summary.style.cssText =
      "cursor:pointer;color:var(--muted-foreground,#888);font-size:12px;user-select:none"
    quote.parentNode?.insertBefore(wrapper, quote)
    wrapper.appendChild(summary)
    wrapper.appendChild(quote)
  }

  return doc.body.innerHTML
}
