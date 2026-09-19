/**
 * mail.mailboxes feature — custom folder management (create / rename /
 * delete) backed by JMAP Mailbox/set.
 *
 * The feature definition is registered in `src/features/catalog.ts`; the
 * sidebar gates these components on the `mail.mailboxes` flag.
 */

export { MailboxRow } from "./mailbox-row"
export { NewFolderRow } from "./new-folder-row"
