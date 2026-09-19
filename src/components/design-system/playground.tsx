import { useId, useMemo, useState } from "react"
import { cn } from "cn"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { CodeBlock } from "./code-block"

export type PlaygroundControl =
  | {
      type: "select"
      name: string
      label?: string
      options: string[]
      defaultValue: string
    }
  | {
      type: "boolean"
      name: string
      label?: string
      defaultValue: boolean
    }
  | {
      type: "text"
      name: string
      label?: string
      defaultValue: string
    }

export type PlaygroundValues = Record<string, string | boolean>

export function Playground({
  title,
  description,
  controls = [],
  render,
  code,
  canvasClassName,
}: {
  title?: string
  description?: string
  controls?: PlaygroundControl[]
  render: (values: PlaygroundValues) => React.ReactNode
  code: (values: PlaygroundValues) => string
  canvasClassName?: string
}) {
  const id = useId()
  const defaults = useMemo(() => {
    const next: PlaygroundValues = {}
    for (const control of controls) next[control.name] = control.defaultValue
    return next
  }, [controls])

  const [values, setValues] = useState<PlaygroundValues>(defaults)

  function setValue(name: string, value: string | boolean) {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const source = code(values)

  return (
    <div className="overflow-hidden rounded-2xl border">
      {title ? (
        <div className="border-b px-4 py-3">
          <p className="text-sm font-medium">{title}</p>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      <Tabs defaultValue="preview">
        <div className="flex items-center justify-between border-b px-2">
          <TabsList variant="line" className="h-10 bg-transparent">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="preview" className="m-0">
          <div
            className={cn(
              "flex min-h-36 items-center justify-center bg-[linear-gradient(to_right,oklch(0.92_0_0_/_0.5)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.92_0_0_/_0.5)_1px,transparent_1px)] bg-size-[16px_16px] p-8 dark:bg-[linear-gradient(to_right,oklch(1_0_0_/_0.06)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0_/_0.06)_1px,transparent_1px)]",
              canvasClassName
            )}
          >
            {render(values)}
          </div>
          {controls.length > 0 ? (
            <div className="grid gap-4 border-t bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {controls.map((control) => (
                <ControlField
                  key={control.name}
                  idPrefix={id}
                  control={control}
                  value={values[control.name]}
                  onChange={(v) => setValue(control.name, v)}
                />
              ))}
            </div>
          ) : null}
        </TabsContent>
        <TabsContent value="code" className="m-0">
          <CodeBlock code={source} className="rounded-none border-0" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ControlField({
  idPrefix,
  control,
  value,
  onChange,
}: {
  idPrefix: string
  control: PlaygroundControl
  value: string | boolean
  onChange: (value: string | boolean) => void
}) {
  const label = control.label ?? control.name
  const fieldId = `${idPrefix}-${control.name}`

  if (control.type === "boolean") {
    return (
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={fieldId} className="text-xs capitalize">
          {label}
        </Label>
        <Switch
          id={fieldId}
          checked={Boolean(value)}
          onCheckedChange={onChange}
        />
      </div>
    )
  }

  if (control.type === "select") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={fieldId} className="text-xs capitalize">
          {label}
        </Label>
        <select
          id={fieldId}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-full rounded-xl border border-transparent bg-input/50 px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          {control.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldId} className="text-xs capitalize">
        {label}
      </Label>
      <Input
        id={fieldId}
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        className="h-8"
      />
    </div>
  )
}
