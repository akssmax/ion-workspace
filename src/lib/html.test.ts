import { describe, expect, it } from "vitest"
import type { EmailProperties } from "../jmap/types/mail"
import {
  attachmentsOf,
  emailHasAttachments,
  emailHtmlBody,
  emailTextBody,
  escapeHtml,
  htmlToText,
  quoteText,
  renderEmailBody,
  sanitizeHtml,
  senderEmail,
  senderName,
} from "./html"

function email(overrides: Partial<EmailProperties> = {}): EmailProperties {
  return {
    id: "e1",
    threadId: "t1",
    mailboxIds: { m1: true },
    ...overrides,
  }
}

describe("escapeHtml", () => {
  it("escapes HTML metacharacters", () => {
    expect(escapeHtml(`<b> & "quotes" 'ok'`)).toBe(
      "&lt;b&gt; &amp; &quot;quotes&quot; &#39;ok&#39;"
    )
  })
})

describe("htmlToText (no-DOM branch)", () => {
  it("converts common block elements and <br> to newlines", () => {
    expect(htmlToText("<p>Hello</p><p>World</p>")).toBe("Hello\nWorld")
  })

  it("strips tags and restores nbsp", () => {
    expect(htmlToText("<div>a&nbsp;b</div>")).toBe("a b")
  })

  it("collapses repeated blank lines", () => {
    expect(htmlToText("<p>a</p><br/><br/><br/><p>b</p>")).toBe("a\n\nb")
  })
})

describe("emailHtmlBody", () => {
  it("returns the first html body part value", () => {
    const e = email({
      htmlBody: [{ partId: "h1" }],
      bodyValues: { h1: { value: "<p>hi</p>" } },
    })
    expect(emailHtmlBody(e)).toBe("<p>hi</p>")
  })

  it("returns undefined without an html body", () => {
    expect(emailHtmlBody(email())).toBeUndefined()
  })
})

describe("emailTextBody", () => {
  it("prefers the text body", () => {
    const e = email({
      textBody: [{ partId: "t1" }],
      bodyValues: { t1: { value: "plain text" } },
    })
    expect(emailTextBody(e)).toBe("plain text")
  })

  it("falls back to converting the html body", () => {
    const e = email({
      htmlBody: [{ partId: "h1" }],
      bodyValues: { h1: { value: "<p>from html</p>" } },
    })
    expect(emailTextBody(e)).toBe("from html")
  })

  it("falls back to the preview", () => {
    expect(emailTextBody(email({ preview: "preview text" }))).toBe(
      "preview text"
    )
  })
})

describe("renderEmailBody", () => {
  it("sanitizes and returns html when present", () => {
    const e = email({
      htmlBody: [{ partId: "h1" }],
      bodyValues: { h1: { value: "<p>hi</p><script>alert(1)</script>" } },
    })
    const out = renderEmailBody(e)
    expect(out).toContain("<p>hi</p>")
    expect(out).not.toContain("script")
  })

  it("escapes plain text inside a pre-wrap wrapper", () => {
    const e = email({
      textBody: [{ partId: "t1" }],
      bodyValues: { t1: { value: "a < b" } },
    })
    const out = renderEmailBody(e)
    expect(out).toContain("white-space:pre-wrap")
    expect(out).toContain("a &lt; b")
  })
})

describe("sanitizeHtml (no-DOM fallback)", () => {
  it("removes script and style blocks", () => {
    const out = sanitizeHtml(
      "<p>ok</p><script>alert(1)</script><style>body{display:none}</style>"
    )
    expect(out).not.toContain("script")
    expect(out).not.toContain("display:none")
    expect(out).toContain("<p>ok</p>")
  })

  it("removes iframes", () => {
    expect(sanitizeHtml('<p>x</p><iframe src="x"></iframe>')).not.toContain(
      "iframe"
    )
  })

  it("strips inline event handler attributes", () => {
    const out = sanitizeHtml('<a href="#" onclick="evil()">x</a>')
    expect(out).not.toContain("onclick")
  })
})

describe("emailHasAttachments / attachmentsOf", () => {
  it("reports attachments when flagged or listed", () => {
    expect(emailHasAttachments(email({ hasAttachment: true }))).toBe(true)
    expect(
      emailHasAttachments(
        email({ attachments: [{ partId: "a1", name: "x.pdf" }] })
      )
    ).toBe(true)
    expect(emailHasAttachments(email())).toBe(false)
  })

  it("attachmentsOf lists parts or defaults to []", () => {
    expect(attachmentsOf(email())).toEqual([])
    const withAtt = email({ attachments: [{ partId: "a1", name: "x.pdf" }] })
    expect(attachmentsOf(withAtt)).toHaveLength(1)
  })
})

describe("sender helpers", () => {
  it("prefers a display name", () => {
    expect(
      senderName(email({ from: [{ name: "Ada", email: "a@x.io" }] }))
    ).toBe("Ada")
    expect(senderName(email({ from: [{ email: "anon@x.io" }] }))).toBe(
      "anon@x.io"
    )
    expect(senderName(email())).toBe("Unknown sender")
  })

  it("senderEmail returns the first address", () => {
    expect(
      senderEmail(email({ from: [{ name: "Ada", email: "a@x.io" }] }))
    ).toBe("a@x.io")
    expect(senderEmail(email())).toBeUndefined()
  })
})

describe("quoteText", () => {
  it("prefixes body lines with >", () => {
    expect(quoteText("line one\n\nline two")).toBe("> line one\n>\n> line two")
  })

  it("includes an attribution when given", () => {
    expect(quoteText("hi", "On Fri, Ada wrote:")).toBe(
      "On Fri, Ada wrote:\n> hi"
    )
  })
})
