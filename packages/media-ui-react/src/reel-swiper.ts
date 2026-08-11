import { useCallback, useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type Ref } from "react";
import { assignRef } from "./utils";

export interface UseReelSwiperOptions<T> {
  items: readonly T[];
  onActiveChange?(item: T, index: number): void;
}

export type ReelElementProps<Element extends HTMLElement = HTMLDivElement> = HTMLAttributes<Element> & {
  ref?: Ref<Element>;
  "data-reel-index"?: number;
};

export interface ReelSwiperResult<T> {
  activeIndex: number;
  activeItem: T | undefined;
  getContainerProps<Element extends HTMLElement = HTMLDivElement>(props?: ReelElementProps<Element>): ReelElementProps<Element>;
  getItemProps<Element extends HTMLElement = HTMLDivElement>(item: T, index: number, props?: ReelElementProps<Element>): ReelElementProps<Element>;
}

const containerBehavior: CSSProperties = { overflowY: "auto", scrollSnapType: "y mandatory" };
const itemBehavior: CSSProperties = { scrollSnapAlign: "start", scrollSnapStop: "always" };

export function useReelSwiper<T>({ items, onActiveChange }: UseReelSwiperOptions<T>): ReelSwiperResult<T> {
  const [activeIndex, setActiveIndex] = useState(0);
  const elements = useRef(new Map<HTMLElement, number>());
  const callbackRef = useRef(onActiveChange);
  callbackRef.current = onActiveChange;

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const active = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!active) return;
      const index = elements.current.get(active.target as HTMLElement);
      if (index === undefined) return;
      setActiveIndex((current) => {
        if (current !== index) callbackRef.current?.(items[index]!, index);
        return index;
      });
    }, { threshold: [0.5, 0.75, 1] });
    for (const element of elements.current.keys()) observer.observe(element);
    return () => observer.disconnect();
  }, [items]);

  const getContainerProps = <Element extends HTMLElement = HTMLDivElement>(props: ReelElementProps<Element> = {}): ReelElementProps<Element> => ({
    ...props,
    role: props.role ?? "region",
    "aria-roledescription": props["aria-roledescription"] ?? "vertical media carousel",
    style: { ...containerBehavior, ...props.style },
  });

  const getItemProps = <Element extends HTMLElement = HTMLDivElement>(_item: T, index: number, props: ReelElementProps<Element> = {}): ReelElementProps<Element> => ({
    ...props,
    role: props.role ?? "group",
    "aria-roledescription": props["aria-roledescription"] ?? "slide",
    "aria-label": props["aria-label"] ?? `${index + 1} of ${items.length}`,
    "aria-current": index === activeIndex ? "true" as const : undefined,
    "data-reel-index": index,
    style: { ...itemBehavior, ...props.style },
    ref: (element: Element | null) => {
      for (const [knownElement, knownIndex] of elements.current) {
        if (knownIndex === index) elements.current.delete(knownElement);
      }
      if (element) elements.current.set(element, index);
      assignRef(props.ref, element);
    },
  });

  return { activeIndex, activeItem: items[activeIndex], getContainerProps, getItemProps };
}
