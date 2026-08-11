// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLightbox } from "./lightbox";

const items = [{ src: "/one.jpg", alt: "First image" }, { src: "/two.jpg", alt: "Second image" }];

afterEach(cleanup);

function Example({ onClose }: { onClose(): void }) {
  const lightbox = useLightbox({ items, onClose });
  return <div {...lightbox.getOverlayProps()}>
    <img {...lightbox.getImageProps()} />
    <button {...lightbox.getPrevButtonProps()}>Previous</button>
    <button {...lightbox.getNextButtonProps()}>Next</button>
    <button {...lightbox.getCloseButtonProps()}>Close</button>
  </div>;
}

describe("useLightbox", () => {
  it("supplies dialog aria props and handles navigation and closing keys", () => {
    const trigger = document.createElement("button");
    document.body.append(trigger);
    trigger.focus();
    const onClose = vi.fn();
    render(<Example onClose={onClose} />);

    const dialog = screen.getByRole("dialog", { name: "First image" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(screen.getByRole("img").getAttribute("alt")).toBe("First image");

    fireEvent.keyDown(dialog, { key: "ArrowRight" });
    expect(screen.getByRole("dialog", { name: "Second image" })).toBeTruthy();
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
