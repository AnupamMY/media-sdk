// There is intentionally no platform divergence yet: these adapters only use
// React context and lifecycle APIs, so importing native UI primitives would add
// a difference without a platform need. Future native-only behavior belongs here.
export { MediaProvider, useMediaClient, type MediaProviderProps } from "./context";
export { useMediaEvents, useMediaTracking, type MediaEventHandlers, type MediaTracking } from "./events";
export {
  useCuratedPhotos,
  usePhoto,
  usePhotoSearch,
  useVideo,
  useVideoSearch,
  type ItemQueryResult,
  type PaginatedQueryResult,
} from "./queries";
export { MediaSDKError } from "@media-sdk/media-core";
export type { MediaEventPayload, PexelsPhoto, PexelsVideo } from "@media-sdk/media-core";
