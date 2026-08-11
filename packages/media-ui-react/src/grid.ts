import { useCallback, useEffect, useRef, useState, type HTMLAttributes, type Ref, type RefObject } from "react";
import { assignRef, callAll } from "./utils";

export interface UseGridOptions<T> {
  items: readonly T[];
  onLoadMore(): void;
  hasNextPage: boolean;
  loading: boolean;
}

export type GridElementProps<Element extends HTMLElement = HTMLDivElement> = HTMLAttributes<Element> & {
  ref?: Ref<Element>;
  "data-grid-index"?: number;
};

export interface GridResult<T> {
  getGridProps<Element extends HTMLElement = HTMLDivElement>(props?: GridElementProps<Element>): GridElementProps<Element>;
  getItemProps<Element extends HTMLElement = HTMLDivElement>(item: T, index: number, props?: GridElementProps<Element>): GridElementProps<Element>;
  sentinelRef: RefObject<HTMLDivElement | null>;
}

export function useGrid<T>({ items, onLoadMore, hasNextPage, loading }: UseGridOptions<T>): GridResult<T> {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemElements = useRef(new Map<number, HTMLElement>());
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || loading) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) onLoadMore();
    }, { rootMargin: "200px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, loading, onLoadMore]);

  const moveFocus = useCallback((nextIndex: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, nextIndex));
    setFocusedIndex(clamped);
    itemElements.current.get(clamped)?.focus();
  }, [items.length]);

  const getGridProps = <Element extends HTMLElement = HTMLDivElement>(props: GridElementProps<Element> = {}): GridElementProps<Element> => ({
    ...props,
    role: "grid",
    "aria-busy": loading,
    "aria-rowcount": items.length,
  });

  const getItemProps = <Element extends HTMLElement = HTMLDivElement>(_item: T, index: number, props: GridElementProps<Element> = {}): GridElementProps<Element> => ({
    ...props,
    id: props.id ?? `media-grid-item-${index}`,
    role: "gridcell",
    tabIndex: index === focusedIndex ? 0 : -1,
    "aria-posinset": index + 1,
    "aria-setsize": items.length,
    "data-grid-index": index,
    ref: (element: Element | null) => {
      if (element) itemElements.current.set(index, element);
      else itemElements.current.delete(index);
      assignRef(props.ref, element);
    },
    onFocus: callAll(props.onFocus, () => setFocusedIndex(index)),
    onKeyDown: callAll(props.onKeyDown, (event) => {
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          moveFocus(index + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          moveFocus(index - 1);
          break;
        case "Home":
          event.preventDefault();
          moveFocus(0);
          break;
        case "End":
          event.preventDefault();
          moveFocus(items.length - 1);
          break;
      }
    }),
  });

  return { getGridProps, getItemProps, sentinelRef };
}
