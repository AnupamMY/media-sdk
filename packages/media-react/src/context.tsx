import { createContext, createElement, useContext, useMemo, type ReactNode } from "react";
import { MediaClient } from "@media-sdk/media-core";

const MediaContext = createContext<MediaClient | null>(null);

export interface MediaProviderProps {
  apiKey: string;
  children: ReactNode;
}

export function MediaProvider({ apiKey, children }: MediaProviderProps) {
  const client = useMemo(() => new MediaClient({ apiKey }), [apiKey]);
  return createElement(MediaContext.Provider, { value: client }, children);
}

export function useMediaClient(): MediaClient {
  const client = useContext(MediaContext);
  if (!client) throw new Error("Media hooks must be used within a MediaProvider.");
  return client;
}
