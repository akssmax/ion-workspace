import { createMiddleware, createStart } from "@tanstack/react-start"
import { isDemoRuntime } from "@/lib/demo/runtime"

/** Fail closed if a workspace feature accidentally attempts an RPC in the demo. */
const demoBoundary = createMiddleware({ type: "function" }).client(
  ({ next }) => {
    if (isDemoRuntime)
      throw new Error("This action is unavailable in the sample workspace.")
    return next()
  }
)

export const startInstance = createStart(() => ({
  functionMiddleware: [demoBoundary],
}))
