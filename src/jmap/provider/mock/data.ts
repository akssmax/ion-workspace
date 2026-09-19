/**
 * Seed data for the in-memory mock JMAP server.
 *
 * Designed to be realistic so the UI can be developed against believable
 * content: full threads, unread counts, starred messages, attachments,
 * calendars/events, contacts and file nodes.
 */

import type { JmapId } from "../../types/mail"
import type { CalendarEvent } from "../../types/calendar"
import type { FileNode } from "../../types/files"

export interface MockMailboxSeed {
  id: JmapId
  name: string
  role?: string
  order?: number
}

export interface MockEmailSeed {
  id: JmapId
  threadId: JmapId
  mailboxIds: Record<string, boolean>
  from?: { name?: string; email: string }[]
  to?: { name?: string; email: string }[]
  cc?: { name?: string; email: string }[]
  bcc?: { name?: string; email: string }[]
  sender?: { name?: string; email: string }[]
  replyTo?: { name?: string; email: string }[]
  subject: string
  textBody: string
  htmlBody?: string
  sentAt: string
  receivedAt: string
  keywords?: Record<string, boolean>
  inReplyTo?: string[]
  references?: string[]
  attachments?: MockAttachmentSeed[]
  hasAttachment?: boolean
  messageId?: string
  headers?: Record<string, string[] | string>
}

export interface MockAttachmentSeed {
  blobId: string
  name: string
  type: string
  size: number
  content: string
}

export interface MockContactSeed {
  id: JmapId
  addressBookIds?: Record<string, boolean>
  fn: string
  n?: { givenNames?: string; familyName?: string }
  organization?: string
  emails?: { type?: string; value: string; isDefault?: boolean }[]
  phones?: { type: string; value: string }[]
  nickname?: string[]
}

export const MOCK_ACCOUNT_ID = "a1"

export interface MockSeedData {
  username: string
  email: string
  name: string
  mailboxes: MockMailboxSeed[]
  emails: MockEmailSeed[]
  identities: { id: string; name: string; email: string }[]
  calendars: { id: JmapId; name: string; color?: string; order?: number }[]
  events: CalendarEvent[]
  addressBooks: { id: JmapId; name: string }[]
  contacts: MockContactSeed[]
  groups: { id: JmapId; names: string[] }[]
  fileNodes: (FileNode & { content?: string })[]
  /** email address → primary key used by recipient autocomplete. */
  autocomplete: Record<string, { contactId: JmapId; fn: string }>
}

const now = Date.now()
const minutes = (n: number) => new Date(now - n * 60_000).toISOString()
const minutesFromNow = (n: number) => new Date(now + n * 60_000).toISOString()
const days = (n: number) => new Date(now - n * 86_400_000).toISOString()

const WEEK_MS = 7 * 86_400_000
const week = (offset: number, h = 10, m = 0): string => {
  const d = new Date(now + offset * WEEK_MS)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export function createSeedData(): MockSeedData {
  const mailboxes: MockMailboxSeed[] = [
    { id: "mbox_inbox", name: "Inbox", role: "inbox", order: 0 },
    { id: "mbox_starred", name: "Starred", role: "flagged", order: 1 },
    { id: "mbox_sent", name: "Sent", role: "sent", order: 2 },
    { id: "mbox_drafts", name: "Drafts", role: "drafts", order: 3 },
    { id: "mbox_archive", name: "Archive", role: "archive", order: 4 },
    { id: "mbox_spam", name: "Spam", role: "junk", order: 5 },
    { id: "mbox_trash", name: "Trash", role: "trash", order: 6 },
    { id: "mbox_label_work", name: "Work", order: 10 },
    { id: "mbox_label_personal", name: "Personal", order: 11 },
    { id: "mbox_label_later", name: "Later", order: 12 },
  ]

  const sally = { name: "Sally Rhodes", email: "sally@rhodes.engineering" }
  const priya = { name: "Priya Sharma", email: "priya@cloudcall.example" }
  const marco = { name: "Marco Delgado", email: "marco@brightlabs.dev" }
  const nina = { name: "Nina Kowalski", email: "nina@foundry.studio" }
  const tom = { name: "Tom Whitfield", email: "tom@acme.example.com" }
  const hannah = { name: "Hannah Lee", email: "hannah@northwind.systems" }
  const you = { name: "You", email: "demo@workspace.local" }
  const dana = { name: "Dana Whitmore", email: "dana@foundry.studio" }
  const mom = { name: "Karen Smith", email: "karen.smith@family.example" }
  const github = { name: "GitHub", email: "notifications@github.com" }
  const figma = { name: "Figma", email: "team@figma.com" }
  const stripe = { name: "Stripe", email: "receipts@stripe.com" }
  const vercel = { name: "Vercel", email: "notifications@vercel.com" }
  const linear = { name: "Linear", email: "digest@linear.app" }
  const united = { name: "United Airlines", email: "unitedairlines@united.com" }
  const recruiter = { name: "Alex Turner", email: "alex.turner@talentbridge.io" }
  const bank = { name: "First National", email: "alerts@firstnational.example" }
  const newsletter = { name: "The Daily Stack", email: "digest@dailystack.news" }
  const aws = { name: "AWS Billing", email: "no-reply-aws@amazon.com" }

  const threads: Record<string, { id: string; subject: string }> = {
    launch: {
      id: "thr_launch",
      subject: "Q3 launch planning — updated schedule",
    },
    review: { id: "thr_review", subject: "Re: Design review notes" },
    budget: {
      id: "thr_budget",
      subject: "Budget approval for the design sprint",
    },
    deploy: { id: "thr_deploy", subject: "Deployment window moved to Friday" },
    welcome: { id: "thr_welcome", subject: "Welcome to your workspace trial" },
    invoice: { id: "thr_invoice", subject: "Invoice #1241 attached" },
    sync: { id: "thr_sync", subject: "Calendar invite: Sync call next week" },
    pr: {
      id: "thr_pr",
      subject: "[ion/workspace] PR #482: Add thread collapsing to Email/query",
    },
    newsletter: {
      id: "thr_newsletter",
      subject: "The Daily Stack #847 — Postgres 18, local-first sync, and the return of RSS",
    },
    receipt: {
      id: "thr_receipt",
      subject: "Receipt from Brightlabs Pro — $29.00",
    },
    flight: {
      id: "thr_flight",
      subject: "Your trip confirmation — SFO to JFK, Oct 2",
    },
    recruiter: {
      id: "thr_recruiter",
      subject: "Staff engineer role — JMAP experience a plus",
    },
    family: { id: "thr_family", subject: "Weekend plans?" },
    bank: {
      id: "thr_bank",
      subject: "Your September statement is ready",
    },
    vercel: {
      id: "thr_vercel",
      subject: "[ion-web] Deployment failed — main",
    },
    linearDigest: {
      id: "thr_linear",
      subject: "Linear weekly digest — 12 issues closed, 4 in review",
    },
    postmortem: {
      id: "thr_postmortem",
      subject: "Postmortem: Sep 12 push-gateway outage (action items inside)",
    },
    awsBill: {
      id: "thr_aws",
      subject: "AWS billing alert: forecast exceeded for September",
    },
    assets: {
      id: "thr_assets",
      subject: "Launch assets — final exports",
    },
    offsite: { id: "thr_offsite", subject: "Re: Team offsite photos" },
    newsletterOld: {
      id: "thr_newsletter_old",
      subject: "The Daily Stack #846 — RSCs reconsidered, sqlite everywhere",
    },
    receiptOld: {
      id: "thr_receipt_old",
      subject: "Receipt from Brightlabs Pro — $29.00",
    },
    q4: { id: "thr_q4", subject: "Ideas for Q4 planning" },
    spam: {
      id: "thr_spam",
      subject: "CONGRATULATIONS!! Your account was selected",
    },
    promo: {
      id: "thr_promo",
      subject: "50% off everything — ends tonight",
    },
  }

  const emails: MockEmailSeed[] = []

  // Thread: launch (4 emails)
  emails.push({
    id: "e_launch_1",
    threadId: threads.launch.id,
    mailboxIds: { mbox_inbox: true, mbox_label_work: true },
    from: [sally],
    to: [you],
    replyTo: [sally],
    subject: threads.launch.subject,
    sentAt: days(6),
    receivedAt: days(6),
    textBody:
      "Hi team — here's the updated schedule for the Q3 launch.\n\nWe're moving the beta window to Thursday and freezing features the Tuesday before. Everything else stays as planned. Let me know if Thursday conflicts with anyone.\n\nThanks,\nSally",
    keywords: {},
    messageId: "<launch-1@rhodes.engineering>",
  })
  emails.push({
    id: "e_launch_2",
    threadId: threads.launch.id,
    mailboxIds: { mbox_inbox: true, mbox_label_work: true },
    from: [priya],
    to: [sally, you],
    subject: "Re: " + threads.launch.subject,
    sentAt: days(5),
    receivedAt: days(5),
    textBody:
      "Thursday works for my team. Could we shift the evening standup to account for the beta deploy? I'd suggest 5:30pm local.\n\nPriya",
    inReplyTo: ["<launch-1@rhodes.engineering>"],
    references: ["<launch-1@rhodes.engineering>"],
    keywords: {},
    messageId: "<launch-2@cloudcall.example>",
  })
  emails.push({
    id: "e_launch_3",
    threadId: threads.launch.id,
    mailboxIds: { mbox_inbox: true, mbox_label_work: true },
    from: [marco],
    to: [sally, priya, you],
    subject: "Re: " + threads.launch.subject,
    sentAt: days(4),
    receivedAt: days(4),
    textBody:
      "Fine by me. I'll make sure the design QA checklist is ready by Wednesday end of day. Attaching the export notes.\n\nMarco",
    inReplyTo: ["<launch-2@cloudcall.example>"],
    references: [
      "<launch-1@rhodes.engineering>",
      "<launch-2@cloudcall.example>",
    ],
    keywords: { $flagged: true },
    attachments: [
      {
        blobId: "blob_notes",
        name: "qa-checklist.pdf",
        type: "application/pdf",
        size: 84_204,
        content:
          "BQAKZXhwZWVkIHNoZWV0cz4gc2lnbj1PZmY+IERlc2lnbiBRQSBDaGVja2xpc3QgLS0gdGVzdCBjYXNlcyBpbiBhdHRhY2htZW50",
      },
    ],
    hasAttachment: true,
    messageId: "<launch-3@brightlabs.dev>",
  })
  emails.push({
    id: "e_launch_4",
    threadId: threads.launch.id,
    mailboxIds: { mbox_inbox: true, mbox_label_work: true },
    from: [sally],
    to: [priya, marco, you],
    subject: "Re: " + threads.launch.subject,
    sentAt: days(3),
    receivedAt: days(3),
    textBody:
      "Great — locking Thursday. I'll send the calendar invite to everyone shortly.\n\nSally",
    inReplyTo: ["<launch-3@brightlabs.dev>"],
    references: [
      "<launch-1@rhodes.engineering>",
      "<launch-2@cloudcall.example>",
      "<launch-3@brightlabs.dev>",
    ],
    keywords: {},
    messageId: "<launch-4@rhodes.engineering>",
  })

  // Thread: review (2 emails, unread)
  emails.push({
    id: "e_review_1",
    threadId: threads.review.id,
    mailboxIds: { mbox_inbox: true, mbox_label_later: true },
    from: [nina],
    to: [you],
    subject: threads.review.subject,
    sentAt: days(2),
    receivedAt: days(2),
    textBody:
      "Morning!\n\nI marked up the design review notes. The empty states on the mobile layout need a second pass, and the calendar week view has an alignment issue on smaller widths.\n\nFull notes attached.\n\nNina",
    attachments: [
      {
        blobId: "blob_review",
        name: "review-notes.docx",
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size: 24_100,
        content:
          "RGVzaWduIHJldmlldyBub3RlcyBmcm9tIE5pbmE6IDEpIGVtcHR5IHN0YXRlcywgaW1wcm92ZWNvcHk7IDIpIGNhbGVuZGFyIHdlZWsgdmlldyBhbGlnbm1lbnQ7IDMpIGNvbXBvc2VyIHRvb2xiYXIgaWNvbiBzbGlnaHRseSB0b28gbGFyZ2Uu",
      },
    ],
    hasAttachment: true,
    keywords: {},
    messageId: "<review-1@foundry.studio>",
  })
  emails.push({
    id: "e_review_2",
    threadId: threads.review.id,
    mailboxIds: { mbox_inbox: true, mbox_label_later: true },
    from: [nina],
    to: [you],
    subject: "Re: " + threads.review.subject,
    sentAt: minutes(42),
    receivedAt: minutes(42),
    textBody:
      "Also — when you get a chance, could you reply to the sync invite for next week? I need a headcount for the room.\n\nNina",
    inReplyTo: ["<review-1@foundry.studio>"],
    references: ["<review-1@foundry.studio>"],
    keywords: {},
    messageId: "<review-2@foundry.studio>",
  })

  // Thread: budget (starred, unread)
  emails.push({
    id: "e_budget_1",
    threadId: threads.budget.id,
    mailboxIds: { mbox_inbox: true, mbox_label_work: true },
    from: [tom],
    to: [you],
    subject: threads.budget.subject,
    sentAt: days(1),
    receivedAt: days(1),
    textBody:
      "Hi,\n\nFollowing up on the budget approval for the design sprint. The finance template is attached; we need a signature by Friday to book the contractor hours.\n\nThanks,\nTom",
    attachments: [
      {
        blobId: "blob_budget",
        name: "sprint-budget-template.xls",
        type: "application/vnd.ms-excel",
        size: 18_400,
        content:
          "U3ByaW50IGJ1ZGdldCB0ZW1wbGF0ZTogY29udHJhY3RvciBob3VycyA4MCBoSWIK",
      },
    ],
    hasAttachment: true,
    keywords: { $flagged: true },
    messageId: "<budget-1@acme.example.com>",
  })

  // Thread: deploy (unread)
  emails.push({
    id: "e_deploy_1",
    threadId: threads.deploy.id,
    mailboxIds: { mbox_inbox: true },
    from: [hannah],
    to: [you],
    subject: threads.deploy.subject,
    sentAt: minutes(18),
    receivedAt: minutes(18),
    textBody:
      "Quick heads up: the deployment window moved to Friday 18:00 UTC. No action needed unless you have outstanding changes staged to this environment.\n\nCheers,\nHannah",
    keywords: {},
    messageId: "<deploy-1@northwind.systems>",
  })

  // Single welcome email
  emails.push({
    id: "e_welcome_1",
    threadId: threads.welcome.id,
    mailboxIds: { mbox_inbox: true, mbox_label_personal: true },
    from: [{ name: "Workspace Team", email: "hello@workspace.local" }],
    to: [you],
    subject: threads.welcome.subject,
    sentAt: days(14),
    receivedAt: days(14),
    textBody:
      "Welcome aboard!\n\nThis is your JMAP-native workspace. Everything you see here is served through JMAP primitives — email, calendar, contacts and files — so the UI stays honest to the protocol.\n\nKeyboard shortcuts: press ? for the list.\n\n— Your workspace team",
    htmlBody:
      '<div style="max-width:520px;margin:0 auto;font-family:-apple-system,Helvetica,Arial,sans-serif;color:#1c1917">' +
      '<h1 style="font-size:22px;margin:0 0 12px">Welcome aboard.</h1>' +
      '<p style="line-height:1.65;margin:0 0 12px">This is your <strong>JMAP-native workspace</strong>. Everything you see here is served through JMAP primitives — email, calendar, contacts and files — so the UI stays honest to the protocol.</p>' +
      '<p style="line-height:1.65;margin:0 0 20px">Keyboard shortcuts: press <kbd style="background:#f5f5f4;border:1px solid #e7e5e4;border-radius:4px;padding:1px 6px">?</kbd> for the list.</p>' +
      '<p style="color:#78716c">— Your workspace team</p>' +
      "</div>",
    keywords: { $seen: true },
    messageId: "<welcome@workspace.local>",
  })

  // Invoice with attachment, archived
  emails.push({
    id: "e_invoice_1",
    threadId: threads.invoice.id,
    mailboxIds: { mbox_archive: true },
    from: [{ name: "Billing", email: "billing@brightlabs.dev" }],
    to: [you],
    subject: threads.invoice.subject,
    sentAt: days(9),
    receivedAt: days(9),
    textBody:
      "Your invoice #1241 is ready. Payment is due in 14 days. Details in the attachment.",
    attachments: [
      {
        blobId: "blob_invoice",
        name: "invoice-1241.pdf",
        type: "application/pdf",
        size: 12_800,
        content:
          "SW52b2ljZSBJTlYtMTI0MSAtIHRvdGFsIDQ4MC4wMCAoZnVsbCBwYWlkIG9uIHJlY2VpcHQp",
      },
    ],
    hasAttachment: true,
    keywords: {},
    messageId: "<invoice@brightlabs.dev>",
  })

  // Draft exists in drafts mailbox
  emails.push({
    id: "e_draft_1",
    threadId: "thr_draft_1",
    mailboxIds: { mbox_drafts: true },
    from: [you],
    to: [sally],
    subject: "Re: " + threads.launch.subject,
    sentAt: minutes(7),
    receivedAt: minutes(7),
    textBody:
      "Hi Sally,\n\nThursday works for me too. One note on the beta window:\n\n",
    keywords: { $draft: true, $seen: true },
    inReplyTo: ["<launch-4@rhodes.engineering>"],
    references: [
      "<launch-1@rhodes.engineering>",
      "<launch-2@cloudcall.example>",
      "<launch-3@brightlabs.dev>",
      "<launch-4@rhodes.engineering>",
    ],
    messageId: "<draft-1@workspace.local>",
  })

  // Sent email
  emails.push({
    id: "e_sent_1",
    threadId: threads.launch.id,
    mailboxIds: { mbox_sent: true },
    from: [you],
    to: [sally],
    subject: "Re: " + threads.launch.subject,
    sentAt: days(2),
    receivedAt: days(2),
    textBody: "Thanks for coordinating — Thursday works on my side as well.",
    keywords: { $sent: true, $seen: true },
    inReplyTo: ["<launch-4@rhodes.engineering>"],
    references: [
      "<launch-1@rhodes.engineering>",
      "<launch-2@cloudcall.example>",
      "<launch-3@brightlabs.dev>",
      "<launch-4@rhodes.engineering>",
    ],
    messageId: "<sent-1@workspace.local>",
  })

  // ---------------------------------------------------------------------------
  // Extended seed set: notifications, receipts, newsletters, personal mail —
  // a mix of read/unread, plain-text and full HTML bodies (some large).
  // ---------------------------------------------------------------------------

  // Thread: GitHub PR review (3 emails, latest unread)
  emails.push({
    id: "e_pr_1",
    threadId: threads.pr.id,
    mailboxIds: { mbox_inbox: true, mbox_label_work: true },
    from: [github],
    to: [you],
    subject: threads.pr.subject,
    sentAt: days(1),
    receivedAt: days(1),
    textBody:
      "nina-kowalski requested your review on pull request #482.\n\nAdd thread collapsing to Email/query\n\n— Collapses to the latest message per thread by default\n— Adds collapseThreads to the request schema\n— Keeps totals consistent with the collapsed view\n\nView it on GitHub: https://github.com/ion/workspace/pull/482",
    htmlBody:
      '<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:14px;color:#24292f">' +
      '<p><strong>nina-kowalski</strong> requested your review on <a href="https://github.com/ion/workspace/pull/482" style="color:#0969da">#482: Add thread collapsing to Email/query</a>.</p>' +
      '<ul style="padding-left:20px;line-height:1.6">' +
      "<li>Collapses to the latest message per thread by default</li>" +
      "<li>Adds <code>collapseThreads</code> to the request schema</li>" +
      "<li>Keeps totals consistent with the collapsed view</li>" +
      "</ul>" +
      '<p style="margin-top:16px"><a href="https://github.com/ion/workspace/pull/482/files" style="display:inline-block;background:#1f883d;color:#ffffff;padding:8px 16px;border-radius:6px;text-decoration:none;font-weight:600">View changes</a></p>' +
      '<p style="color:#57606a;font-size:12px;margin-top:24px">You are receiving this because your review was requested.<br>Reply to this email directly or view it on GitHub.</p>' +
      "</div>",
    keywords: { $seen: true },
    messageId: "<pr-482-1@github.com>",
  })
  emails.push({
    id: "e_pr_2",
    threadId: threads.pr.id,
    mailboxIds: { mbox_inbox: true, mbox_label_work: true },
    from: [github],
    to: [you],
    subject: "Re: " + threads.pr.subject,
    sentAt: minutes(360),
    receivedAt: minutes(360),
    textBody:
      "nina-kowalski left a comment:\n\n> collapseThreads defaults to true\n\nCan we default this to false for search results? Otherwise `from:x` queries hide earlier matches in the same thread, which feels wrong.\n\nView the comment: https://github.com/ion/workspace/pull/482#discussion_r12",
    htmlBody:
      '<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:14px;color:#24292f">' +
      "<p><strong>nina-kowalski</strong> left a comment:</p>" +
      '<blockquote style="margin:0 0 12px;padding:8px 12px;border-left:3px solid #d0d7de;color:#57606a">collapseThreads defaults to true</blockquote>' +
      "<p>Can we default this to <code>false</code> for search results? Otherwise <code>from:x</code> queries hide earlier matches in the same thread, which feels wrong.</p>" +
      '<p style="margin-top:16px"><a href="https://github.com/ion/workspace/pull/482#discussion_r12" style="color:#0969da">View the comment</a></p>' +
      "</div>",
    keywords: { $seen: true },
    inReplyTo: ["<pr-482-1@github.com>"],
    references: ["<pr-482-1@github.com>"],
    messageId: "<pr-482-2@github.com>",
  })
  emails.push({
    id: "e_pr_3",
    threadId: threads.pr.id,
    mailboxIds: { mbox_inbox: true, mbox_label_work: true },
    from: [github],
    to: [you],
    subject: "Re: " + threads.pr.subject,
    sentAt: minutes(95),
    receivedAt: minutes(95),
    textBody:
      "nina-kowalski pushed 2 commits:\n\n  9f31c2e Default collapseThreads to false for filtered queries\n  b77aa10 Add regression test for search + collapse interplay\n\nView the diff: https://github.com/ion/workspace/pull/482/files/9f31c2e..b77aa10",
    keywords: {},
    inReplyTo: ["<pr-482-2@github.com>"],
    references: ["<pr-482-1@github.com>", "<pr-482-2@github.com>"],
    messageId: "<pr-482-3@github.com>",
  })

  // Newsletter — large HTML body
  emails.push({
    id: "e_newsletter_1",
    threadId: threads.newsletter.id,
    mailboxIds: { mbox_inbox: true },
    from: [newsletter],
    to: [you],
    subject: threads.newsletter.subject,
    sentAt: minutes(240),
    receivedAt: minutes(240),
    textBody:
      "THE DAILY STACK — Issue #847\n\n1. Postgres 18 ships with async I/O\nThe headline feature is the new asynchronous I/O subsystem, which early benchmarks show delivering 2-3x read throughput on cloud storage. Upgrade notes inside.\n\n2. Local-first sync engines compared\nWe benchmarked five sync engines on a 50k-row dataset. The results surprised us — especially around conflict resolution overhead.\n\n3. The quiet return of RSS\nReader traffic is up 40% year over year. We look at why developers are rebuilding their own feeds.\n\n---\nYou are receiving this because you subscribed at dailystack.news.\nUnsubscribe: https://dailystack.news/unsubscribe",
    htmlBody:
      '<div style="max-width:560px;margin:0 auto;font-family:Georgia,serif;color:#1a1a1a">' +
      '<div style="background:#0f172a;padding:24px 28px;border-radius:12px 12px 0 0">' +
      '<span style="color:#38bdf8;font-family:monospace;font-size:12px;letter-spacing:2px">ISSUE #847</span>' +
      '<h1 style="color:#ffffff;font-size:24px;margin:8px 0 0;font-family:Helvetica,Arial,sans-serif">The Daily Stack</h1>' +
      "</div>" +
      '<div style="border:1px solid #e2e8f0;border-top:none;padding:28px;border-radius:0 0 12px 12px">' +
      '<h2 style="font-family:Helvetica,Arial,sans-serif;font-size:17px;margin:0 0 8px">1. Postgres 18 ships with async I/O</h2>' +
      '<p style="line-height:1.65;margin:0 0 6px">The headline feature is the new asynchronous I/O subsystem, which early benchmarks show delivering <strong>2–3x read throughput</strong> on cloud storage. If you run analytical workloads on network-attached disks, this release matters to you.</p>' +
      '<p style="line-height:1.65;margin:0 0 20px">Upgrade notes: the on-disk format is unchanged, but <code style="background:#f1f5f9;padding:1px 5px;border-radius:4px">io_method</code> defaults to <code style="background:#f1f5f9;padding:1px 5px;border-radius:4px">worker</code> on Linux — set it explicitly before you benchmark.</p>' +
      '<h2 style="font-family:Helvetica,Arial,sans-serif;font-size:17px;margin:0 0 8px">2. Local-first sync engines compared</h2>' +
      '<p style="line-height:1.65;margin:0 0 20px">We benchmarked five sync engines on a 50k-row dataset with realistic conflict rates. The results surprised us — especially around conflict-resolution overhead, which dominated sync time for two of the five. Full tables and methodology on the site.</p>' +
      '<h2 style="font-family:Helvetica,Arial,sans-serif;font-size:17px;margin:0 0 8px">3. The quiet return of RSS</h2>' +
      '<p style="line-height:1.65;margin:0 0 24px">Reader traffic is up 40% year over year. We talked to four teams who deleted their algorithmic feeds and rebuilt reading habits around self-hosted RSS. The common thread: fewer, better sources.</p>' +
      '<p style="text-align:center;margin:0 0 28px"><a href="https://dailystack.news/issues/847" style="display:inline-block;background:#0f172a;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-weight:600">Read the full issue</a></p>' +
      '<hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 16px">' +
      '<p style="font-size:12px;color:#64748b;font-family:Helvetica,Arial,sans-serif;line-height:1.6">The Daily Stack · 410 Townsend St, San Francisco, CA<br>You are receiving this because you subscribed at dailystack.news.<br><a href="https://dailystack.news/unsubscribe" style="color:#64748b">Unsubscribe</a> · <a href="https://dailystack.news/preferences" style="color:#64748b">Manage preferences</a></p>' +
      "</div></div>",
    keywords: { $seen: true },
    messageId: "<issue-847@dailystack.news>",
  })

  // Stripe receipt — HTML table
  emails.push({
    id: "e_receipt_1",
    threadId: threads.receipt.id,
    mailboxIds: { mbox_inbox: true },
    from: [stripe],
    to: [you],
    subject: threads.receipt.subject,
    sentAt: days(1),
    receivedAt: days(1),
    textBody:
      "Receipt #2841-5590\n\nBrightlabs Pro — Monthly subscription\nAmount paid: $29.00\nDate: " +
      days(1).slice(0, 10) +
      "\nPayment method: Visa ending in 4242\n\nInvoice: https://pay.stripe.com/invoice/inv_2841\n\nThanks for your business.",
    htmlBody:
      '<div style="max-width:480px;margin:0 auto;font-family:-apple-system,Helvetica,Arial,sans-serif;color:#32325d">' +
      '<div style="text-align:center;padding:24px 0"><span style="font-size:28px;font-weight:700">$29.00</span>' +
      '<p style="margin:4px 0 0;color:#6b7c93">Paid to Brightlabs Pro</p></div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:14px">' +
      '<tr style="border-top:1px solid #e6ebf1"><td style="padding:10px 0;color:#6b7c93">Receipt number</td><td style="padding:10px 0;text-align:right">2841-5590</td></tr>' +
      '<tr style="border-top:1px solid #e6ebf1"><td style="padding:10px 0;color:#6b7c93">Payment method</td><td style="padding:10px 0;text-align:right">Visa ···· 4242</td></tr>' +
      '<tr style="border-top:1px solid #e6ebf1"><td style="padding:10px 0;color:#6b7c93">Subscription</td><td style="padding:10px 0;text-align:right">Brightlabs Pro (monthly)</td></tr>' +
      '<tr style="border-top:1px solid #e6ebf1;border-bottom:1px solid #e6ebf1"><td style="padding:10px 0;font-weight:600">Total</td><td style="padding:10px 0;text-align:right;font-weight:600">$29.00</td></tr>' +
      "</table>" +
      '<p style="margin-top:20px;text-align:center"><a href="https://pay.stripe.com/invoice/inv_2841" style="color:#635bff;font-weight:600">Download invoice (PDF)</a></p>' +
      '<p style="font-size:12px;color:#8898aa;text-align:center;margin-top:24px">Something wrong? <a href="https://support.stripe.com" style="color:#635bff">Contact Stripe support</a></p>' +
      "</div>",
    keywords: { $seen: true },
    messageId: "<receipt-2841@stripe.com>",
  })

  // Flight confirmation — large HTML itinerary
  emails.push({
    id: "e_flight_1",
    threadId: threads.flight.id,
    mailboxIds: { mbox_inbox: true, mbox_label_personal: true },
    from: [united],
    to: [you],
    subject: threads.flight.subject,
    sentAt: days(2),
    receivedAt: days(2),
    textBody:
      "Booking confirmation: XK7P2R\n\nUA 1847 — San Francisco (SFO) to New York (JFK)\nDeparts: Thu, Oct 2 at 8:15 AM PDT\nArrives: Thu, Oct 2 at 4:52 PM EDT\nSeat: 14A (Economy Plus)\n\nUA 209 — New York (JFK) to San Francisco (SFO)\nDeparts: Sun, Oct 5 at 6:30 PM EDT\nArrives: Sun, Oct 5 at 10:05 PM PDT\nSeat: 21C\n\nManage your trip: https://www.united.com/mytrips/XK7P2R",
    htmlBody:
      '<div style="max-width:600px;margin:0 auto;font-family:-apple-system,Helvetica,Arial,sans-serif;color:#1a1a1a">' +
      '<div style="background:#002244;padding:20px 28px"><span style="color:#ffffff;font-size:18px;font-weight:700">UNITED</span></div>' +
      '<div style="padding:28px;border:1px solid #d9dee4;border-top:none">' +
      '<p style="margin:0 0 4px;color:#5f6b7a;font-size:13px">Confirmation number</p>' +
      '<p style="margin:0 0 24px;font-size:22px;font-weight:700;letter-spacing:1px">XK7P2R</p>' +
      '<table style="width:100%;border-collapse:collapse;margin-bottom:24px">' +
      '<tr><td style="padding:14px 16px;background:#f4f6f8;border-radius:8px 0 0 8px"><strong style="font-size:16px">SFO</strong><br><span style="color:#5f6b7a;font-size:13px">San Francisco<br>Thu, Oct 2 · 8:15 AM</span></td>' +
      '<td style="padding:14px 8px;text-align:center;color:#5f6b7a;background:#f4f6f8">UA 1847<br>✈</td>' +
      '<td style="padding:14px 16px;text-align:right;background:#f4f6f8;border-radius:0 8px 8px 0"><strong style="font-size:16px">JFK</strong><br><span style="color:#5f6b7a;font-size:13px">New York<br>Thu, Oct 2 · 4:52 PM</span></td></tr>' +
      "</table>" +
      '<table style="width:100%;border-collapse:collapse;margin-bottom:24px">' +
      '<tr><td style="padding:14px 16px;background:#f4f6f8;border-radius:8px 0 0 8px"><strong style="font-size:16px">JFK</strong><br><span style="color:#5f6b7a;font-size:13px">New York<br>Sun, Oct 5 · 6:30 PM</span></td>' +
      '<td style="padding:14px 8px;text-align:center;color:#5f6b7a;background:#f4f6f8">UA 209<br>✈</td>' +
      '<td style="padding:14px 16px;text-align:right;background:#f4f6f8;border-radius:0 8px 8px 0"><strong style="font-size:16px">SFO</strong><br><span style="color:#5f6b7a;font-size:13px">San Francisco<br>Sun, Oct 5 · 10:05 PM</span></td></tr>' +
      "</table>" +
      '<p style="font-size:14px;line-height:1.6"><strong>Seats:</strong> 14A (outbound, Economy Plus) · 21C (return)</p>' +
      '<p style="margin:20px 0"><a href="https://www.united.com/mytrips/XK7P2R" style="display:inline-block;background:#002244;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Manage trip</a></p>' +
      '<p style="font-size:12px;color:#5f6b7a;line-height:1.6">Check-in opens 24 hours before departure. Bag fees may apply. This itinerary is subject to the Contract of Carriage.</p>' +
      "</div></div>",
    keywords: { $seen: true, $flagged: true },
    messageId: "<xk7p2r@united.com>",
  })

  // Recruiter thread (2 emails, latest unread)
  emails.push({
    id: "e_recruiter_1",
    threadId: threads.recruiter.id,
    mailboxIds: { mbox_inbox: true },
    from: [recruiter],
    to: [you],
    subject: threads.recruiter.subject,
    sentAt: days(3),
    receivedAt: days(3),
    textBody:
      "Hi there,\n\nI came across your profile while researching engineers with deep email-protocol experience. I'm working with a Series C company building a compliance-focused mail platform, and JMAP expertise is genuinely rare — your background looks like a strong match for a Staff Engineer role they're opening.\n\nThe pitch in one line: own the sync layer end to end, greenfield, small senior team, competitive package.\n\nOpen to a 15-minute call this week?\n\nBest,\nAlex Turner\nTalentbridge",
    keywords: { $seen: true },
    messageId: "<rec-1@talentbridge.io>",
  })
  emails.push({
    id: "e_recruiter_2",
    threadId: threads.recruiter.id,
    mailboxIds: { mbox_inbox: true },
    from: [recruiter],
    to: [you],
    subject: "Re: " + threads.recruiter.subject,
    sentAt: minutes(420),
    receivedAt: minutes(420),
    textBody:
      "Hi again — just floating this back up in case it got buried. Happy to send over the full role spec first if that's easier; no call required.\n\nEither way, no worries if the timing isn't right.\n\nAlex",
    keywords: {},
    inReplyTo: ["<rec-1@talentbridge.io>"],
    references: ["<rec-1@talentbridge.io>"],
    messageId: "<rec-2@talentbridge.io>",
  })

  // Family thread (2 emails, unread, personal label)
  emails.push({
    id: "e_family_1",
    threadId: threads.family.id,
    mailboxIds: { mbox_inbox: true, mbox_label_personal: true },
    from: [mom],
    to: [you],
    subject: threads.family.subject,
    sentAt: days(1),
    receivedAt: days(1),
    textBody:
      "Hi sweetie,\n\nAre you still coming up this weekend? Your dad wants to try the new smoker, so Saturday lunch is the plan. Bring that hot sauce you like if you remember — the one from the farmers market.\n\nAlso, Aunt Linda says hi and wants to know if you're still doing \"the email thing.\" I told her yes, you are very much still doing the email thing.\n\nLove,\nMom",
    keywords: { $seen: true },
    messageId: "<fam-1@family.example>",
  })
  emails.push({
    id: "e_family_2",
    threadId: threads.family.id,
    mailboxIds: { mbox_inbox: true, mbox_label_personal: true },
    from: [mom],
    to: [you],
    subject: "Re: " + threads.family.subject,
    sentAt: minutes(150),
    receivedAt: minutes(150),
    textBody:
      "Oh — and can you look at my iPad when you're here? The photos app is doing the thing again where it says storage is full but I deleted SO many videos.\n\nLove you!",
    keywords: {},
    inReplyTo: ["<fam-1@family.example>"],
    references: ["<fam-1@family.example>"],
    messageId: "<fam-2@family.example>",
  })

  // Bank statement (read)
  emails.push({
    id: "e_bank_1",
    threadId: threads.bank.id,
    mailboxIds: { mbox_inbox: true },
    from: [bank],
    to: [you],
    subject: threads.bank.subject,
    sentAt: days(4),
    receivedAt: days(4),
    textBody:
      "Your September statement for checking account ····7712 is now available.\n\nSign in to view or download your statement: https://firstnational.example/statements\n\nFor your security, we never include account details in email.\n\nFirst National Bank",
    keywords: { $seen: true },
    messageId: "<stmt-sep@firstnational.example>",
  })

  // Vercel deploy failure (unread, work)
  emails.push({
    id: "e_vercel_1",
    threadId: threads.vercel.id,
    mailboxIds: { mbox_inbox: true, mbox_label_work: true },
    from: [vercel],
    to: [you],
    subject: threads.vercel.subject,
    sentAt: minutes(55),
    receivedAt: minutes(55),
    textBody:
      "Deployment failed for ion-web (main).\n\nCommit: b77aa10 — Add regression test for search + collapse interplay\nError: Build exceeded the 45-minute limit during `vite build`.\n\nInspect: https://vercel.com/ion/ion-web/deployments/dpl_9f31c2e\n\nCommon causes: large un-cached dependency install, memory pressure during SSR prerender.",
    htmlBody:
      '<div style="font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:14px;color:#171717;max-width:520px">' +
      '<p style="font-size:16px;font-weight:600">Deployment failed — <span style="color:#dc2626">ion-web</span> (main)</p>' +
      '<p style="color:#525252;line-height:1.6">Commit <code style="background:#f5f5f5;padding:1px 6px;border-radius:4px">b77aa10</code> — Add regression test for search + collapse interplay</p>' +
      '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;color:#991b1b;font-size:13px">Error: Build exceeded the 45-minute limit during <code>vite build</code>.</div>' +
      '<p style="margin-top:16px"><a href="https://vercel.com/ion/ion-web/deployments/dpl_9f31c2e" style="display:inline-block;background:#171717;color:#fff;padding:9px 18px;border-radius:6px;text-decoration:none;font-weight:600">Inspect deployment</a></p>' +
      "</div>",
    keywords: {},
    messageId: "<dpl-9f31c2e@vercel.com>",
  })

  // Linear weekly digest (read, HTML)
  emails.push({
    id: "e_linear_1",
    threadId: threads.linearDigest.id,
    mailboxIds: { mbox_inbox: true, mbox_label_work: true },
    from: [linear],
    to: [you],
    subject: threads.linearDigest.subject,
    sentAt: days(1),
    receivedAt: days(1),
    textBody:
      "Your week in Ion Workspace\n\nCompleted: 12 issues\nIn review: 4\nIn progress: 6\n\nHighlights:\n— ION-318 Thread collapsing shipped to staging\n— ION-302 Composer autosave regression fixed\n— ION-297 Mailbox counters now update on Email/set\n\nOpen your team: https://linear.app/ion/team/ENG",
    htmlBody:
      '<div style="font-family:-apple-system,Helvetica,Arial,sans-serif;font-size:14px;color:#222;max-width:520px">' +
      '<p style="font-size:16px;font-weight:600">Your week in Ion Workspace</p>' +
      '<table style="width:100%;border-collapse:collapse;text-align:center;margin:16px 0">' +
      '<tr><td style="padding:14px;background:#f7f8f9;border-radius:8px 0 0 8px"><span style="font-size:22px;font-weight:700;color:#16a34a">12</span><br><span style="font-size:12px;color:#6b7280">Completed</span></td>' +
      '<td style="padding:14px;background:#f7f8f9"><span style="font-size:22px;font-weight:700;color:#d97706">4</span><br><span style="font-size:12px;color:#6b7280">In review</span></td>' +
      '<td style="padding:14px;background:#f7f8f9;border-radius:0 8px 8px 0"><span style="font-size:22px;font-weight:700;color:#2563eb">6</span><br><span style="font-size:12px;color:#6b7280">In progress</span></td></tr>' +
      "</table>" +
      '<ul style="line-height:1.8;padding-left:20px">' +
      "<li><strong>ION-318</strong> Thread collapsing shipped to staging</li>" +
      "<li><strong>ION-302</strong> Composer autosave regression fixed</li>" +
      "<li><strong>ION-297</strong> Mailbox counters now update on Email/set</li>" +
      "</ul>" +
      '<p><a href="https://linear.app/ion/team/ENG" style="color:#5e6ad2;font-weight:600">Open your team in Linear</a></p>' +
      "</div>",
    keywords: { $seen: true },
    messageId: "<digest-w38@linear.app>",
  })

  // Postmortem — very long plain-text body (read, work)
  emails.push({
    id: "e_postmortem_1",
    threadId: threads.postmortem.id,
    mailboxIds: { mbox_inbox: true, mbox_label_work: true },
    from: [hannah],
    to: [sally, priya, marco, nina, you],
    subject: threads.postmortem.subject,
    sentAt: days(5),
    receivedAt: days(5),
    textBody:
      "Team,\n\nHere is the postmortem for the September 12 push-gateway outage. Total customer-visible impact was 47 minutes (14:03–14:50 UTC). No data was lost; events were delayed, not dropped. Please read the action items at the bottom — owners and dates are assigned.\n\n== Summary ==\n\nAt 14:03 UTC our alerting fired on a spike in undelivered JMAP push events. The push gateway had exhausted its WebSocket connection table after a deploy at 13:58 changed the keep-alive interval from 30s to 300s. Idle connections stopped being reaped, the table filled, and new subscriptions were rejected. Clients fell back to polling, which masked the failure for roughly four minutes.\n\n== Timeline (all UTC) ==\n\n13:58 — Deploy d-8812 begins (keep-alive change, reviewed, tests green)\n14:03 — Alert: push_delivery_lag > 60s (p95)\n14:05 — Hannah begins investigation, assumes broker lag\n14:11 — Broker ruled out; queue depth normal\n14:16 — Connection table saturation identified via /debug/conns\n14:19 — Decision to roll back d-8812\n14:24 — Rollback complete; table drains slowly (idle conns still held)\n14:31 — Forced reaper run; lag begins recovering\n14:50 — p95 lag back under 5s; incident closed\n\n== Root cause ==\n\nThe keep-alive interval is also used as the idle-timeout heuristic. This coupling was not documented and was not obvious from the config surface. Raising the interval to 300s raised the effective idle timeout past the connection-table TTL, so dead connections accumulated faster than they were reaped.\n\n== What went well ==\n\n— Alerting fired within 5 minutes of user impact.\n— Rollback was clean and fast; the deploy pipeline did exactly what it should.\n— Client polling fallback worked as designed and limited blast radius.\n\n== What went poorly ==\n\n— We lost 13 minutes investigating the broker because the connection-table metric is not on the main dashboard.\n— The keep-alive/idle-timeout coupling was tribal knowledge.\n— No load test covers connection churn at table-limit scale.\n\n== Action items ==\n\n1. Decouple idle timeout from keep-alive interval (owner: Hannah, Sep 26)\n2. Add connection-table utilization to the main dashboard + alert at 70% (owner: Priya, Sep 22)\n3. Document the push gateway config surface, including all coupled knobs (owner: Marco, Sep 24)\n4. Add a connection-churn load test to the pre-deploy suite (owner: Sally, Oct 3)\n5. Write a runbook entry for push-lag alerts linking the above (owner: Hannah, Sep 26)\n\nThanks everyone for the quick response. Reply here with corrections or additions and I'll fold them into the wiki copy.\n\nHannah",
    keywords: { $seen: true },
    messageId: "<pm-sep12@northwind.systems>",
  })

  // AWS billing alert (unread)
  emails.push({
    id: "e_aws_1",
    threadId: threads.awsBill.id,
    mailboxIds: { mbox_inbox: true },
    from: [aws],
    to: [you],
    subject: threads.awsBill.subject,
    sentAt: minutes(500),
    receivedAt: minutes(500),
    textBody:
      "AWS Billing Alert\n\nYour forecasted September spend for account 7712-0091-3345 is $412.88, which exceeds your configured budget of $350.00 (118% of budget).\n\nTop services by forecasted cost:\n1. Amazon EC2 — $201.44\n2. Amazon RDS — $118.02\n3. Amazon S3 — $47.19\n\nReview your cost explorer: https://console.aws.amazon.com/cost-management/home\n\nThis is an automated notification.",
    keywords: {},
    messageId: "<budget-alert-sep@amazon.com>",
  })

  // Launch assets thread (2 emails, read, work, attachment)
  emails.push({
    id: "e_assets_1",
    threadId: threads.assets.id,
    mailboxIds: { mbox_inbox: true, mbox_label_work: true },
    from: [dana],
    to: [nina, you],
    cc: [marco],
    subject: threads.assets.subject,
    sentAt: days(2),
    receivedAt: days(2),
    textBody:
      "Hi both,\n\nFinal exports for the launch are attached — the orbit mark at 16/32/64px, plus the footer lockup in light and dark. The 16px cut has the tightened nucleus Nina asked for.\n\nIf nothing looks off by EOD I'll hand these to Sally for the landing page.\n\nDana",
    attachments: [
      {
        blobId: "blob_assets",
        name: "launch-assets-final.zip",
        type: "application/zip",
        size: 412_900,
        content:
          "TGF1bmNoIGFzc2V0cyBmaW5hbCBleHBvcnRzOiBvcmJpdCBtYXJrIDE2LzMyLzY0cHgsIGZvb3RlciBsb2NrdXAgbGlnaHQgKyBkYXJrLg==",
      },
    ],
    hasAttachment: true,
    keywords: { $seen: true },
    messageId: "<assets-1@foundry.studio>",
  })
  emails.push({
    id: "e_assets_2",
    threadId: threads.assets.id,
    mailboxIds: { mbox_inbox: true, mbox_label_work: true },
    from: [nina],
    to: [dana, you],
    cc: [marco],
    subject: "Re: " + threads.assets.subject,
    sentAt: days(2),
    receivedAt: days(2),
    textBody:
      "These look great — the 16px reads cleanly now. Ship them.\n\nOne tiny thing for next time: the dark footer lockup could use 2% more letter-spacing, but it's not a blocker.\n\nNina",
    keywords: { $seen: true },
    inReplyTo: ["<assets-1@foundry.studio>"],
    references: ["<assets-1@foundry.studio>"],
    messageId: "<assets-2@foundry.studio>",
  })

  // Figma comment notification (unread)
  emails.push({
    id: "e_figma_1",
    threadId: "thr_figma",
    mailboxIds: { mbox_inbox: true, mbox_label_work: true },
    from: [figma],
    to: [you],
    subject: "Nina mentioned you in Ion — Marketing site",
    sentAt: minutes(25),
    receivedAt: minutes(25),
    textBody:
      "Nina Kowalski mentioned you in a comment on \"Ion — Marketing site\":\n\n\"@you can we steal the inbox empty-state illustration for the 404 page? It fits the tone perfectly.\"\n\nReply in Figma: https://www.figma.com/file/ion-marketing?comment=8812",
    keywords: {},
    messageId: "<comment-8812@figma.com>",
  })

  // Archive: offsite photos (read, personal)
  emails.push({
    id: "e_offsite_1",
    threadId: threads.offsite.id,
    mailboxIds: { mbox_archive: true, mbox_label_personal: true },
    from: [priya],
    to: [sally, marco, nina, you],
    subject: "Team offsite photos",
    sentAt: days(21),
    receivedAt: days(21),
    textBody:
      "Hi all,\n\nThe photos from the offsite are finally edited — 214 of them, fair warning. The shared album link is below. My personal favorite is the one where Marco is mid-sentence in every single group shot.\n\nAlbum: https://photos.example.com/album/offsite-2026\n\nPriya",
    keywords: { $seen: true },
    messageId: "<offsite-1@cloudcall.example>",
  })
  emails.push({
    id: "e_offsite_2",
    threadId: threads.offsite.id,
    mailboxIds: { mbox_archive: true, mbox_label_personal: true },
    from: [marco],
    to: [priya, sally, nina, you],
    subject: "Re: " + threads.offsite.subject,
    sentAt: days(20),
    receivedAt: days(20),
    textBody:
      "I contain multitudes.\n\n(These are great, thank you! Printing the one from the boat.)\n\nMarco",
    keywords: { $seen: true },
    inReplyTo: ["<offsite-1@cloudcall.example>"],
    references: ["<offsite-1@cloudcall.example>"],
    messageId: "<offsite-2@brightlabs.dev>",
  })

  // Archive: older newsletter issue (read)
  emails.push({
    id: "e_newsletter_old_1",
    threadId: threads.newsletterOld.id,
    mailboxIds: { mbox_archive: true },
    from: [newsletter],
    to: [you],
    subject: threads.newsletterOld.subject,
    sentAt: days(7),
    receivedAt: days(7),
    textBody:
      "THE DAILY STACK — Issue #846\n\n1. RSCs reconsidered: what a year of React Server Components taught three production teams.\n\n2. SQLite everywhere: embedded replicas, edge reads, and when NOT to do it.\n\n3. The hidden cost of notification fatigue in dev tools.\n\n---\nUnsubscribe: https://dailystack.news/unsubscribe",
    keywords: { $seen: true },
    messageId: "<issue-846@dailystack.news>",
  })

  // Archive: older receipt (read)
  emails.push({
    id: "e_receipt_old_1",
    threadId: threads.receiptOld.id,
    mailboxIds: { mbox_archive: true },
    from: [stripe],
    to: [you],
    subject: threads.receiptOld.subject,
    sentAt: days(32),
    receivedAt: days(32),
    textBody:
      "Receipt #2710-4418\n\nBrightlabs Pro — Monthly subscription\nAmount paid: $29.00\nPayment method: Visa ending in 4242\n\nInvoice: https://pay.stripe.com/invoice/inv_2710",
    keywords: { $seen: true },
    messageId: "<receipt-2710@stripe.com>",
  })

  // Sent: reply to mom
  emails.push({
    id: "e_sent_2",
    threadId: threads.family.id,
    mailboxIds: { mbox_sent: true },
    from: [you],
    to: [mom],
    subject: "Re: " + threads.family.subject,
    sentAt: days(1),
    receivedAt: days(1),
    textBody:
      "Hi Mom,\n\nYes — I'll be there Saturday around 11. I'll grab the hot sauce on the way.\n\nTell Aunt Linda I am indeed still doing the email thing, and it's going well. And I'll fix the iPad — it's almost certainly iCloud backups eating the storage, not your videos.\n\nLove you!",
    keywords: { $sent: true, $seen: true },
    inReplyTo: ["<fam-1@family.example>"],
    references: ["<fam-1@family.example>"],
    messageId: "<sent-2@workspace.local>",
  })

  // Sent: reply to deploy notice
  emails.push({
    id: "e_sent_3",
    threadId: threads.deploy.id,
    mailboxIds: { mbox_sent: true },
    from: [you],
    to: [hannah],
    subject: "Re: " + threads.deploy.subject,
    sentAt: minutes(10),
    receivedAt: minutes(10),
    textBody:
      "Thanks Hannah — nothing staged on my side, so Friday 18:00 works.\n\nAppreciate the heads up.",
    keywords: { $sent: true, $seen: true },
    inReplyTo: ["<deploy-1@northwind.systems>"],
    references: ["<deploy-1@northwind.systems>"],
    messageId: "<sent-3@workspace.local>",
  })

  // Sent: postmortem follow-up
  emails.push({
    id: "e_sent_4",
    threadId: threads.postmortem.id,
    mailboxIds: { mbox_sent: true },
    from: [you],
    to: [hannah],
    cc: [sally],
    subject: "Re: " + threads.postmortem.subject,
    sentAt: days(4),
    receivedAt: days(4),
    textBody:
      "Great writeup, Hannah.\n\nOne addition for the wiki copy: the polling fallback masked the failure for ~4 minutes, which is worth calling out as both a win and a detection gap — our alert lag budget should assume the fallback will hide the first N minutes.\n\nHappy to take action item 4 with Sally if she wants a second pair of hands.",
    keywords: { $sent: true, $seen: true },
    inReplyTo: ["<pm-sep12@northwind.systems>"],
    references: ["<pm-sep12@northwind.systems>"],
    messageId: "<sent-4@workspace.local>",
  })

  // Draft: Q4 ideas (unfinished)
  emails.push({
    id: "e_draft_2",
    threadId: threads.q4.id,
    mailboxIds: { mbox_drafts: true },
    from: [you],
    to: [sally],
    subject: threads.q4.subject,
    sentAt: minutes(130),
    receivedAt: minutes(130),
    textBody:
      "Hi Sally,\n\nBefore the Q4 planning doc goes around, a few things I'd like to get on the list:\n\n1. Push gateway hardening (from the postmortem action items)\n2. Offline mode for mail — the IndexedDB cache is already\n\n",
    keywords: { $draft: true, $seen: true },
    messageId: "<draft-2@workspace.local>",
  })

  // Spam
  emails.push({
    id: "e_spam_1",
    threadId: threads.spam.id,
    mailboxIds: { mbox_spam: true },
    from: [{ name: "Prize Notification Center", email: "winner@totally-legit-prizes.example" }],
    to: [you],
    subject: threads.spam.subject,
    sentAt: days(1),
    receivedAt: days(1),
    textBody:
      "CONGRATULATIONS!!!\n\nYour email address was selected in our INTERNATIONAL EMAIL LOTTERY. You have won $2,500,000.00 USD!!!\n\nTo claim your prize, simply reply with your full name, address, and bank details.\n\nAct NOW — this offer expires in 24 HOURS!!!",
    keywords: {},
    messageId: "<spam-1@totally-legit-prizes.example>",
  })

  // Trash: promo
  emails.push({
    id: "e_promo_1",
    threadId: threads.promo.id,
    mailboxIds: { mbox_trash: true },
    from: [{ name: "GadgetWorld", email: "deals@gadgetworld.example" }],
    to: [you],
    subject: threads.promo.subject,
    sentAt: days(6),
    receivedAt: days(6),
    textBody:
      "FINAL HOURS: 50% off everything in the store. Keyboards, mice, docks, cables — if it plugs in, it's on sale.\n\nShop now: https://gadgetworld.example/sale\n\nUnsubscribe: https://gadgetworld.example/unsub",
    keywords: { $seen: true },
    messageId: "<promo-1@gadgetworld.example>",
  })

  // Calendar events
  const events: CalendarEvent[] = [
    {
      id: "evt_1",
      calendarId: "cal_personal",
      uid: "uid-sync-1",
      title: "Sync call with design",
      description: "Weekly sync. Agenda attached in email thread.",
      location: "Zoom",
      start: week(0, 10, 0)
        .replace(".", "Z")
        .replace(/\.00Z$/, "Z"),
      duration: "PT1H",
      freeBusyStatus: "BUSY",
      attendees: [
        {
          name: "You",
          email: "demo@workspace.local",
          participationStatus: "ACCEPTED",
          role: "CHAIR",
        },
        {
          name: "Nina Kowalski",
          email: "nina@foundry.studio",
          participationStatus: "ACCEPTED",
        },
        {
          name: "Marco Delgado",
          email: "marco@brightlabs.dev",
          participationStatus: "TENTATIVE",
        },
      ],
      reminders: [{ type: "display", trigger: "-PT15M" }],
      timeZone: "UTC",
    },
    {
      id: "evt_2",
      calendarId: "cal_work",
      uid: "uid-launch",
      title: "Q3 Launch — beta window",
      description: "Start of the Q3 beta launch window.",
      start: week(1, 13, 0)
        .replace(".", "Z")
        .replace(/\.00Z$/, "Z"),
      duration: "PT2H",
      freeBusyStatus: "BUSY",
    },
    {
      id: "evt_3",
      calendarId: "cal_personal",
      uid: "uid-lunch",
      title: "Lunch with Priya",
      start: week(1, 12, 0)
        .replace(".", "Z")
        .replace(/\.00Z$/, "Z"),
      duration: "PT1H",
      showWithoutTime: false,
      freeBusyStatus: "BUSY",
    },
    {
      id: "evt_4",
      calendarId: "cal_work",
      uid: "uid-deploy",
      title: "Friday deploy window",
      start: week(1, 18, 0)
        .replace(".", "Z")
        .replace(/\.00Z$/, "Z"),
      duration: "PT4H",
      freeBusyStatus: "BUSY",
    },
    {
      id: "evt_5",
      calendarId: "cal_personal",
      uid: "uid-anniversary",
      title: "Design sprint (2 days)",
      allDay: true,
      showWithoutTime: true,
      start: week(2, 0, 0)
        .replace(".", "Z")
        .replace(/\.00Z$/, "Z"),
      duration: "P2D",
      freeBusyStatus: "TENTATIVE",
    },
    {
      id: "evt_live",
      calendarId: "cal_work",
      uid: "uid-standup",
      title: "Standup",
      description: "Daily engineering standup.",
      location: "Meet",
      start: minutesFromNow(-12),
      duration: "PT30M",
      freeBusyStatus: "BUSY",
      timeZone: "UTC",
    },
    {
      id: "evt_soon",
      calendarId: "cal_personal",
      uid: "uid-1on1",
      title: "1:1 with Sally",
      location: "Zoom",
      start: minutesFromNow(18),
      duration: "PT30M",
      freeBusyStatus: "BUSY",
      timeZone: "UTC",
    },
    {
      id: "evt_later",
      calendarId: "cal_work",
      uid: "uid-critique",
      title: "Design critique",
      location: "Room 4B",
      start: minutesFromNow(180),
      duration: "PT1H",
      freeBusyStatus: "BUSY",
      timeZone: "UTC",
    },
  ]

  // Contacts
  const contacts: MockContactSeed[] = [
    {
      id: "ct_1",
      addressBookIds: { ab_main: true, ab_friends: true },
      fn: "Sally Rhodes",
      n: { givenNames: "Sally", familyName: "Rhodes" },
      organization: "Rhodes Engineering",
      emails: [
        { type: "work", value: "sally@rhodes.engineering", isDefault: true },
      ],
      phones: [{ type: "work", value: "+1 (555) 010-2233" }],
      nickname: ["Sals"],
    },
    {
      id: "ct_2",
      addressBookIds: { ab_main: true },
      fn: "Priya Sharma",
      n: { givenNames: "Priya", familyName: "Sharma" },
      organization: "Cloudcall",
      emails: [
        { type: "work", value: "priya@cloudcall.example", isDefault: true },
      ],
      phones: [{ type: "mobile", value: "+44 7700 900123" }],
    },
    {
      id: "ct_3",
      addressBookIds: { ab_main: true, ab_work: true },
      fn: "Marco Delgado",
      n: { givenNames: "Marco", familyName: "Delgado" },
      organization: "Brightlabs",
      emails: [
        { type: "work", value: "marco@brightlabs.dev", isDefault: true },
      ],
    },
    {
      id: "ct_4",
      addressBookIds: { ab_main: true, ab_work: true },
      fn: "Nina Kowalski",
      n: { givenNames: "Nina", familyName: "Kowalski" },
      organization: "Foundry Studio",
      emails: [{ type: "work", value: "nina@foundry.studio", isDefault: true }],
      nickname: ["Nin"],
    },
    {
      id: "ct_5",
      addressBookIds: { ab_main: true },
      fn: "Tom Whitfield",
      n: { givenNames: "Tom", familyName: "Whitfield" },
      organization: "Acme",
      emails: [
        { type: "work", value: "tom@acme.example.com", isDefault: true },
      ],
    },
    {
      id: "ct_6",
      addressBookIds: { ab_main: true, ab_work: true },
      fn: "Hannah Lee",
      n: { givenNames: "Hannah", familyName: "Lee" },
      organization: "Northwind Systems",
      emails: [
        { type: "work", value: "hannah@northwind.systems", isDefault: true },
      ],
    },
    {
      id: "ct_7",
      addressBookIds: { ab_main: true, ab_work: true },
      fn: "Dana Whitmore",
      n: { givenNames: "Dana", familyName: "Whitmore" },
      organization: "Foundry Studio",
      emails: [
        { type: "work", value: "dana@foundry.studio", isDefault: true },
      ],
    },
    {
      id: "ct_8",
      addressBookIds: { ab_main: true, ab_friends: true },
      fn: "Karen Smith",
      n: { givenNames: "Karen", familyName: "Smith" },
      emails: [
        { type: "home", value: "karen.smith@family.example", isDefault: true },
      ],
      phones: [{ type: "mobile", value: "+1 (555) 014-7788" }],
      nickname: ["Mom"],
    },
    {
      id: "ct_9",
      addressBookIds: { ab_main: true },
      fn: "Alex Turner",
      n: { givenNames: "Alex", familyName: "Turner" },
      organization: "Talentbridge",
      emails: [
        { type: "work", value: "alex.turner@talentbridge.io", isDefault: true },
      ],
    },
  ]

  const addressBooks = [
    { id: "ab_main", name: "Personal" },
    { id: "ab_work", name: "Work" },
    { id: "ab_friends", name: "Friends" },
  ]

  const groups = [
    { id: "grp_1", names: ["Design"], tagId: undefined },
    { id: "grp_2", names: ["Contractors"], tagId: undefined },
  ]

  const fileNodes: (FileNode & { content?: string })[] = [
    {
      id: "fn_root",
      name: "Files",
      isFile: false,
      contentType: "application/octet-stream",
      size: 0,
      parentId: null,
      childNodeIds: ["fn_docs", "fn_assets", "fn_notes"],
    },
    {
      id: "fn_docs",
      name: "Documents",
      isFile: false,
      contentType: "application/octet-stream",
      size: 0,
      parentId: "fn_root",
      childNodeIds: ["fn_spec", "fn_report"],
    },
    {
      id: "fn_spec",
      name: "product-spec.md",
      isFile: true,
      contentType: "text/markdown",
      size: 4_210,
      parentId: "fn_docs",
      content: "# Product spec\n\nA JMAP-native workspace...\n",
    },
    {
      id: "fn_report",
      name: "q2-summary.pdf",
      isFile: true,
      contentType: "application/pdf",
      size: 98_300,
      parentId: "fn_docs",
      content: "Q2 summary report (mock).",
    },
    {
      id: "fn_assets",
      name: "Assets",
      isFile: false,
      contentType: "application/octet-stream",
      size: 0,
      parentId: "fn_root",
      childNodeIds: ["fn_logo"],
    },
    {
      id: "fn_logo",
      name: "logo.svg",
      isFile: true,
      contentType: "image/svg+xml",
      size: 1_890,
      parentId: "fn_assets",
      content:
        "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='#0ea5a0'/></svg>",
    },
    {
      id: "fn_notes",
      name: "Meeting notes",
      isFile: false,
      contentType: "application/octet-stream",
      size: 0,
      parentId: "fn_root",
      childNodeIds: [],
    },
  ]

  const autocomplete: Record<string, { contactId: JmapId; fn: string }> = {}
  for (const c of contacts) {
    for (const e of c.emails ?? []) {
      autocomplete[e.value.toLowerCase()] = { contactId: c.id, fn: c.fn }
    }
  }

  return {
    username: "demo",
    email: "demo@workspace.local",
    name: "You",
    mailboxes,
    emails,
    identities: [{ id: "idn_1", name: "You", email: "demo@workspace.local" }],
    calendars: [
      { id: "cal_personal", name: "Personal", color: "sky" },
      { id: "cal_work", name: "Work", color: "violet" },
    ],
    events,
    addressBooks,
    contacts,
    groups,
    fileNodes,
    autocomplete,
  }
}
