/**
 * mail.labels feature — JMAP-native labels via multi-mailbox membership.
 *
 * The feature definition is registered in `src/features/catalog.ts`; core UI
 * gates these components on the `mail.labels` flag.
 */

export { LabelMenu } from "./label-menu"
export { LabelChips } from "./label-chips"
export { LabelChip } from "./label-chip"
export { isLabelMailbox, labelsOf, emailLabels } from "./labels"
export {
  useTagAppearance,
  TagAppearancePicker,
  TagAppearanceDialog,
  TagAppearanceControl,
  TagAppearanceBadge,
  TagAppearanceDraftControl,
} from "./tag-appearance"
