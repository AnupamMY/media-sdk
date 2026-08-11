// @vitest-environment jsdom
import { useCallback } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGrid } from "./grid";
import { MockIntersectionObserver } from "./test-observer";

function Example({ onLoadMore }: { onLoadMore(): void }) {
  const items = ["one", "two"];
  const stableLoadMore = useCallback(onLoadMore, [onLoadMore]);
  const { getGridProps, getItemProps, sentinelRef } = useGrid({ items, onLoadMore: stableLoadMore, hasNextPage: true, loading: false });
  return <>
    <div {...getGridProps()}>
      {items.map((item, index) => <div key={item} {...getItemProps(item, index)}>{item}</div>)}
    </div>
    <div ref={sentinelRef} data-testid="sentinel" />
  </>;
}

beforeEach(() => {
  MockIntersectionObserver.reset();
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useGrid", () => {
  it("returns accessible props and supports keyboard navigation", () => {
    render(<Example onLoadMore={() => undefined} />);
    const cells = screen.getAllByRole("gridcell");
    expect(screen.getByRole("grid").getAttribute("aria-busy")).toBe("false");
    expect(cells[0]?.getAttribute("aria-posinset")).toBe("1");
    expect(cells[0]?.getAttribute("tabindex")).toBe("0");

    cells[0]?.focus();
    fireEvent.keyDown(cells[0]!, { key: "ArrowRight" });
    expect(document.activeElement).toBe(cells[1]);
    expect(cells[1]?.getAttribute("tabindex")).toBe("0");
  });

  it("loads more when its sentinel intersects", () => {
    const onLoadMore = vi.fn();
    render(<Example onLoadMore={onLoadMore} />);
    act(() => MockIntersectionObserver.instances[0]?.trigger([{ target: screen.getByTestId("sentinel") }]));
    expect(onLoadMore).toHaveBeenCalledOnce();
  });
});
