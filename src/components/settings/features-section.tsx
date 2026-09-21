/**
 * Features settings: one toggle per registered feature (see
 * src/features/registry.ts), plus any sections contributed by feature
 * modules through the `settingsSections` contribution point.
 */

import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { listFeatures } from "@/features/registry"
import { useFeatureFlags, useSetFeatureFlag } from "@/features/flags"
import { settingsSections, useContributions } from "@/features/contributions"
import { SaveState } from "./setting-row"

export function FeaturesSection() {
  const flags = useFeatureFlags()
  const { setFlag, isSaving, isError } = useSetFeatureFlag()
  const extraSections = useContributions(settingsSections)
  const features = listFeatures()

  return (
    <div className="space-y-5">
      <section className="space-y-1">
        {features.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No optional features available yet.
          </p>
        ) : (
          features.map((feature) => (
            <div
              key={feature.id}
              className="flex items-center justify-between gap-4 py-2"
            >
              <div className="space-y-0.5">
                <Label htmlFor={`feature-${feature.id}`}>
                  {feature.title}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {feature.description}
                </p>
              </div>
              <Switch
                id={`feature-${feature.id}`}
                checked={flags[feature.id] ?? feature.defaultEnabled}
                onCheckedChange={(checked) =>
                  void setFlag(feature.id, checked)
                }
              />
            </div>
          ))
        )}
      </section>

      {extraSections.length > 0 ? <Separator /> : null}
      {extraSections.map((Section, i) => (
        <Section key={i} />
      ))}

      <SaveState isSaving={isSaving} isError={isError} />
    </div>
  )
}
