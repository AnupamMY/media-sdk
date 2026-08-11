import { vi } from "vitest";

export class MockIntersectionObserver implements IntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  readonly root = null;
  readonly rootMargin = "0px";
  readonly thresholds = [0];
  readonly observe = vi.fn();
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();
  readonly takeRecords = vi.fn(() => [] as IntersectionObserverEntry[]);

  constructor(private readonly callback: IntersectionObserverCallback) {
    MockIntersectionObserver.instances.push(this);
  }

  trigger(entries: Array<Partial<IntersectionObserverEntry> & Pick<IntersectionObserverEntry, "target">>): void {
    const complete = entries.map(({ target, ...entry }) => ({
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      intersectionRatio: 1,
      isIntersecting: true,
      rootBounds: null,
      target,
      time: 0,
      ...entry,
    }));
    this.callback(complete, this);
  }

  static reset(): void {
    MockIntersectionObserver.instances = [];
  }
}
