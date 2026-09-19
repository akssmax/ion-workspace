/** A capped loop that stops scheduling entirely while suspended. */
export function createAnimationLoop(
  render: (time: number) => void,
  fps: number
) {
  let active = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let frame: number | undefined
  const interval = 1000 / Math.max(1, Math.min(fps, 60))

  function tick(time: number) {
    frame = undefined
    if (!active) return
    render(time)
    // The render callback can synchronously stop this loop.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (active) {
      timer = setTimeout(() => {
        timer = undefined
        if (active) frame = requestAnimationFrame(tick)
      }, interval)
    }
  }

  return {
    start() {
      if (active) return
      active = true
      frame = requestAnimationFrame(tick)
    },
    stop() {
      active = false
      if (timer !== undefined) clearTimeout(timer)
      if (frame !== undefined) cancelAnimationFrame(frame)
      timer = undefined
      frame = undefined
    },
  }
}
