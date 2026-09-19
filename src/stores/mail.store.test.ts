import { beforeEach, describe, expect, it } from "vitest"
import { useMailStore } from "./mail.store"

const VISIBLE = ["t1", "t2", "t3", "t4", "t5"]

describe("mail store selection", () => {
  beforeEach(() => {
    useMailStore.setState({
      activeMailboxId: null,
      focusedThreadId: null,
      selectedThreadIds: [],
      visibleThreadIds: [...VISIBLE],
      searchQuery: "",
      paneView: "list+reading",
    })
  })

  it("toggleThreadSelection adds and removes ids", () => {
    const s = useMailStore.getState()
    s.toggleThreadSelection("t2")
    expect(useMailStore.getState().selectedThreadIds).toEqual(["t2"])
    s.toggleThreadSelection("t2")
    expect(useMailStore.getState().selectedThreadIds).toEqual([])
  })

  it("selectRange selects the forward range between anchor and target", () => {
    useMailStore.getState().selectRange("t2", "t4")
    expect(useMailStore.getState().selectedThreadIds).toEqual([
      "t2",
      "t3",
      "t4",
    ])
  })

  it("selectRange works backwards (target above anchor)", () => {
    useMailStore.getState().selectRange("t4", "t2")
    expect(useMailStore.getState().selectedThreadIds).toEqual([
      "t2",
      "t3",
      "t4",
    ])
  })

  it("selectRange unions with an existing selection", () => {
    useMailStore.setState({ selectedThreadIds: ["t5"] })
    useMailStore.getState().selectRange("t1", "t2")
    expect(useMailStore.getState().selectedThreadIds).toEqual([
      "t5",
      "t1",
      "t2",
    ])
  })

  it("selectRange falls back to single-select when anchor is not visible", () => {
    useMailStore.getState().selectRange("nope", "t3")
    expect(useMailStore.getState().selectedThreadIds).toEqual(["t3"])
  })

  it("selectRange on the same row selects just that row", () => {
    useMailStore.getState().selectRange("t3", "t3")
    expect(useMailStore.getState().selectedThreadIds).toEqual(["t3"])
  })

  it("opening a thread focuses it without checking the row", () => {
    useMailStore.setState({ selectedThreadIds: ["t5"] })
    useMailStore.getState().setFocusedThread("t1")
    expect(useMailStore.getState().focusedThreadId).toBe("t1")
    expect(useMailStore.getState().selectedThreadIds).toEqual([])
  })

  it("setVisibleThreadIds is a no-op for identical lists", () => {
    const before = useMailStore.getState().visibleThreadIds
    useMailStore.getState().setVisibleThreadIds([...VISIBLE])
    expect(useMailStore.getState().visibleThreadIds).toBe(before)
  })
})
