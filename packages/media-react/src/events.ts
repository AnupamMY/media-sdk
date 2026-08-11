import { useCallback, useEffect } from "react";
import type { MediaClientEvents, MediaEventPayload } from "@media-sdk/media-core";
import { useMediaClient } from "./context";

export type MediaEventHandlers = Partial<{
  [EventName in keyof MediaClientEvents]: (payload: MediaClientEvents[EventName]) => void;
}>;

export function useMediaEvents(handlers: MediaEventHandlers): void {
  const client = useMediaClient();
  const download = handlers.download;
  const view = handlers.view;
  useEffect(() => {
    const unsubscribers = [
      download ? client.on("download", download) : undefined,
      view ? client.on("view", view) : undefined,
    ];
    return () => { for (const unsubscribe of unsubscribers) unsubscribe?.(); };
  }, [client, download, view]);
}

export interface MediaTracking {
  trackDownload(payload: MediaEventPayload): void;
  trackView(payload: MediaEventPayload): void;
}

export function useMediaTracking(): MediaTracking {
  const client = useMediaClient();
  const trackDownload = useCallback((payload: MediaEventPayload) => client.emit("download", payload), [client]);
  const trackView = useCallback((payload: MediaEventPayload) => client.emit("view", payload), [client]);
  return { trackDownload, trackView };
}
