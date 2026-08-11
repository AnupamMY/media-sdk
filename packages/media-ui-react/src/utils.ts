import type { MutableRefObject, Ref } from "react";

export function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as MutableRefObject<T | null>).current = value;
}

export function callAll<Event>(
  consumer: ((event: Event) => void) | undefined,
  internal: (event: Event) => void,
): (event: Event) => void {
  return (event) => {
    consumer?.(event);
    if (!(event as { defaultPrevented?: boolean }).defaultPrevented) internal(event);
  };
}
