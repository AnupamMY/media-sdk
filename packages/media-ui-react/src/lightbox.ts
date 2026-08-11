import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type Ref,
} from "react";
import { assignRef, callAll } from "./utils";

export interface LightboxImageItem {
  src: string;
  alt: string;
}

export interface UseLightboxOptions<T extends LightboxImageItem> {
  items: readonly T[];
  initialIndex?: number;
  onClose(): void;
}

export type LightboxOverlayProps<Element extends HTMLElement = HTMLDivElement> = HTMLAttributes<Element> & { ref?: Ref<Element> };

export interface LightboxResult<T extends LightboxImageItem> {
  currentItem: T | undefined;
  currentIndex: number;
  getOverlayProps<Element extends HTMLElement = HTMLDivElement>(props?: LightboxOverlayProps<Element>): LightboxOverlayProps<Element>;
  getImageProps(props?: ImgHTMLAttributes<HTMLImageElement>): ImgHTMLAttributes<HTMLImageElement>;
  getNextButtonProps(props?: ButtonHTMLAttributes<HTMLButtonElement>): ButtonHTMLAttributes<HTMLButtonElement>;
  getPrevButtonProps(props?: ButtonHTMLAttributes<HTMLButtonElement>): ButtonHTMLAttributes<HTMLButtonElement>;
  getCloseButtonProps(props?: ButtonHTMLAttributes<HTMLButtonElement>): ButtonHTMLAttributes<HTMLButtonElement>;
}

const focusableSelector = "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

export function useLightbox<T extends LightboxImageItem>({ items, initialIndex = 0, onClose }: UseLightboxOptions<T>): LightboxResult<T> {
  const [currentIndex, setCurrentIndex] = useState(() => Math.max(0, Math.min(items.length - 1, initialIndex)));
  const overlayRef = useRef<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const currentItem = items[currentIndex];

  useLayoutEffect(() => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overlay = overlayRef.current;
    const firstFocusable = overlay?.querySelector<HTMLElement>(focusableSelector);
    (firstFocusable ?? overlay)?.focus();
  }, []);

  useEffect(() => {
    if (currentIndex >= items.length) setCurrentIndex(Math.max(0, items.length - 1));
  }, [currentIndex, items.length]);

  const close = useCallback(() => {
    triggerRef.current?.focus();
    onClose();
  }, [onClose]);
  const next = useCallback(() => setCurrentIndex((index) => Math.min(items.length - 1, index + 1)), [items.length]);
  const previous = useCallback(() => setCurrentIndex((index) => Math.max(0, index - 1)), []);

  const getOverlayProps = <Element extends HTMLElement = HTMLDivElement>(props: LightboxOverlayProps<Element> = {}): LightboxOverlayProps<Element> => ({
    ...props,
    role: "dialog",
    "aria-modal": true,
    "aria-label": currentItem?.alt ?? "Media viewer",
    tabIndex: props.tabIndex ?? -1,
    ref: (element: Element | null) => {
      overlayRef.current = element;
      assignRef(props.ref, element);
    },
    onKeyDown: callAll(props.onKeyDown, (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        previous();
      } else if (event.key === "Tab") {
        const focusable = [...(overlayRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])];
        if (focusable.length === 0) {
          event.preventDefault();
          overlayRef.current?.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }),
  });

  const getImageProps = useCallback((props: ImgHTMLAttributes<HTMLImageElement> = {}) => ({
    ...props,
    src: currentItem?.src,
    alt: currentItem?.alt ?? "",
    draggable: props.draggable ?? false,
  }), [currentItem]);

  const getNextButtonProps = useCallback((props: ButtonHTMLAttributes<HTMLButtonElement> = {}) => ({
    ...props,
    type: props.type ?? "button",
    "aria-label": props["aria-label"] ?? "Next item",
    disabled: props.disabled ?? currentIndex >= items.length - 1,
    onClick: callAll(props.onClick, next),
  }), [currentIndex, items.length, next]);

  const getPrevButtonProps = useCallback((props: ButtonHTMLAttributes<HTMLButtonElement> = {}) => ({
    ...props,
    type: props.type ?? "button",
    "aria-label": props["aria-label"] ?? "Previous item",
    disabled: props.disabled ?? currentIndex <= 0,
    onClick: callAll(props.onClick, previous),
  }), [currentIndex, previous]);

  const getCloseButtonProps = useCallback((props: ButtonHTMLAttributes<HTMLButtonElement> = {}) => ({
    ...props,
    type: props.type ?? "button",
    "aria-label": props["aria-label"] ?? "Close viewer",
    onClick: callAll(props.onClick, close),
  }), [close]);

  return { currentItem, currentIndex, getOverlayProps, getImageProps, getNextButtonProps, getPrevButtonProps, getCloseButtonProps };
}
