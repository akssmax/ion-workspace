/**
 * Compose dialog state (Zustand). Holds the "in-flight" composer intent
 * plus staged uploads; the message body itself lives in Tiptap's editor.
 */

import { create } from "zustand"
import type { UploadedBlob } from "../jmap/types"

export type ComposeMode = "new" | "reply" | "reply-all" | "forward" | "draft"

export interface Recipient {
  name?: string
  email: string
}

export type SendState = "idle" | "sending" | "sent" | "queued" | "failed"

export interface ComposeState {
  open: boolean
  mode: ComposeMode
  draftEmailId: string | null
  identityId: string | null
  inReplyTo: string[] | null
  references: string[] | null
  to: Recipient[]
  cc: Recipient[]
  bcc: Recipient[]
  subject: string
  attachments: UploadedBlob[]
  quotedText?: string
  /** Lifecycle of the last send attempt, surfaced app-wide. */
  sendState: SendState
  sendError: string | null
  openCompose: (init?: Partial<ComposeState>) => void
  updateCompose: (patch: Partial<ComposeState>) => void
  addAttachment: (blob: UploadedBlob) => void
  removeAttachment: (blobId: string) => void
  clearAttachments: () => void
  closeCompose: () => void
  setSendState: (state: SendState, error?: string | null) => void
}

const empty: Pick<
  ComposeState,
  | "mode"
  | "draftEmailId"
  | "identityId"
  | "inReplyTo"
  | "references"
  | "to"
  | "cc"
  | "bcc"
  | "subject"
  | "attachments"
  | "quotedText"
> = {
  mode: "new",
  draftEmailId: null,
  identityId: null,
  inReplyTo: null,
  references: null,
  to: [],
  cc: [],
  bcc: [],
  subject: "",
  attachments: [],
  quotedText: undefined,
}

export const useComposerStore = create<ComposeState>((set) => ({
  open: false,
  ...empty,
  sendState: "idle",
  sendError: null,
  openCompose: (init) =>
    set({
      open: true,
      ...empty,
      ...init,
    }),
  updateCompose: (patch) => set(patch),
  addAttachment: (blob) =>
    set((s) => ({ attachments: [...s.attachments, blob] })),
  removeAttachment: (blobId) =>
    set((s) => ({
      attachments: s.attachments.filter((a) => a.blobId !== blobId),
    })),
  clearAttachments: () => set({ attachments: [] }),
  closeCompose: () =>
    set({
      open: false,
      ...empty,
    }),
  setSendState: (sendState, error = null) =>
    set({ sendState, sendError: error }),
}))
