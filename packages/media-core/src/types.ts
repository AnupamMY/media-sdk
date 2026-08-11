export interface PaginationOptions {
  page?: number;
  perPage?: number;
}

export interface PexelsPhotoSource {
  original: string;
  large2x: string;
  large: string;
  medium: string;
  small: string;
  portrait: string;
  landscape: string;
  tiny: string;
}

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string | null;
  src: PexelsPhotoSource;
  liked: boolean;
  alt: string;
}

export interface PexelsVideoFile {
  id: number;
  quality: "hd" | "sd" | string;
  file_type: string;
  width: number | null;
  height: number | null;
  fps: number | null;
  link: string;
  size?: number;
}

export interface PexelsVideoPicture {
  id: number;
  picture: string;
  nr: number;
}

export interface PexelsVideoUser {
  id: number;
  name: string;
  url: string;
}

export interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: PexelsVideoUser;
  video_files: PexelsVideoFile[];
  video_pictures: PexelsVideoPicture[];
}

export interface PaginatedMedia<T> {
  items: T[];
  page: number;
  totalResults: number;
  hasNextPage: boolean;
}

export interface MediaEventPayload {
  id: number;
  type: "photo" | "video";
}

export interface MediaClientEvents {
  download: MediaEventPayload;
  view: MediaEventPayload;
}

export interface FetchResponse {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}

export type FetchFunction = (
  url: string,
  init: { method: "GET"; headers: Readonly<Record<string, string>> },
) => Promise<FetchResponse>;

export interface MediaClientOptions {
  apiKey: string;
  cacheTtlMs?: number;
  fetch?: FetchFunction;
}
