// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useReelSwiper } from "./reel-swiper";
import { MockIntersectionObserver } from "./test-observer";

function Example({ onActiveChange }: { onActiveChange(item: string, index: number): void }) {
  const items = ["one", "two"];
  const { getContainerProps, getItemProps } = useReelSwiper({ items, onActiveChange });
  return <div {...getContainerProps()}>
    {items.map((item, index) => <div key={item} {...getItemProps(item, index)}>{item}</div>)}
  </div>;
}

beforeEach(() => {
  MockIntersectionObserver.reset();
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useReelSwiper", () => {
  it("marks the most visible intersecting item active", () => {
    const onActiveChange = vi.fn();
    render(<Example onActiveChange={onActiveChange} />);
    const slides = screen.getAllByRole("group");
    expect(slides[0]?.getAttribute("aria-current")).toBe("true");

    act(() => MockIntersectionObserver.instances[0]?.trigger([
      { target: slides[0]!, intersectionRatio: 0.4 },
      { target: slides[1]!, intersectionRatio: 0.9 },
    ]));

    expect(onActiveChange).toHaveBeenCalledWith("two", 1);
    expect(slides[1]?.getAttribute("aria-current")).toBe("true");
  });
});
