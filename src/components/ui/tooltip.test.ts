// @vitest-environment jsdom
import { createElement } from "react"
import { afterEach, describe, expect, it } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"

afterEach(() => cleanup())

describe("design-system tooltip", () => {
  it("waits 500 ms before showing on hover", async () => {
    render(createElement(TooltipProvider, {}, createElement(Tooltip, {},
      createElement(TooltipTrigger, { render: createElement("button", { type: "button", "aria-label": "Star" }) }, "★"),
      createElement(TooltipContent, {}, "Star message"))))
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Star" }), { pointerType: "mouse" })
    fireEvent.mouseEnter(screen.getByRole("button", { name: "Star" }))
    fireEvent.mouseMove(screen.getByRole("button", { name: "Star" }))
    await new Promise(resolve => setTimeout(resolve, 350))
    expect(screen.queryByText("Star message")).toBeNull()
    expect(await screen.findByText("Star message", {}, { timeout: 700 })).toBeTruthy()
  })
  it("delays the next tooltip instead of opening it immediately", async () => {
    render(createElement(TooltipProvider, {},
      createElement(Tooltip, {}, createElement(TooltipTrigger, { render: createElement("button", { "aria-label": "First" }) }, "A"), createElement(TooltipContent, {}, "First help")),
      createElement(Tooltip, {}, createElement(TooltipTrigger, { render: createElement("button", { "aria-label": "Second" }) }, "B"), createElement(TooltipContent, {}, "Second help"))))
    const first = screen.getByRole("button", { name: "First" })
    const second = screen.getByRole("button", { name: "Second" })
    fireEvent.pointerEnter(first, { pointerType: "mouse" }); fireEvent.mouseEnter(first); fireEvent.mouseMove(first)
    expect(await screen.findByText("First help", {}, { timeout: 800 })).toBeTruthy()
    fireEvent.mouseLeave(first)
    fireEvent.pointerEnter(second, { pointerType: "mouse" }); fireEvent.mouseEnter(second); fireEvent.mouseMove(second)
    await new Promise(resolve => setTimeout(resolve, 180))
    expect(screen.queryByText("Second help")).toBeNull()
    expect(await screen.findByText("Second help", {}, { timeout: 700 })).toBeTruthy()
  })
})
