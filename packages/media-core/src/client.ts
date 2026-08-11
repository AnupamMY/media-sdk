import { MediaSDKError, type MediaSDKErrorCode } from "./errors";
import { TypedEventEmitter } from "./emitter";
import type {
  FetchFunction,
  MediaClientEvents,
  MediaClientOptions,
  PaginatedMedia,
  PaginationOptions,
  PexelsPhoto,
  PexelsVideo,
} from "./types";

const PHOTO_API_URL = "https://api.pexels.com/v1";
const VIDEO_API_URL = "https://api.pexels.com/videos";
const DEFAULT_CACHE_TTL_MS = 60_000;
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 15;

interface PexelsPhotoPage {
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  total_results: number;
  next_page?: string;
}

interface PexelsVideoPage {
  page: number;
  per_page: number;
  videos: PexelsVideo[];
  total_results: number;
  next_page?: string;
}

interface CacheEntry {
  expiresAt: number;
  value: unknown;
}

function globalFetch(): FetchFunction {
  const candidate = globalThis.fetch;
  if (typeof candidate !== "function") {
    throw new MediaSDKError("NETWORK_ERROR", "No fetch implementation is available.");
  }

  return (url, init) => candidate(url, init);
}

function pagination(options: PaginationOptions = {}): Required<PaginationOptions> {
  const page = options.page ?? DEFAULT_PAGE;
  const perPage = options.perPage ?? DEFAULT_PER_PAGE;
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(perPage) || perPage < 1) {
    throw new MediaSDKError("BAD_REQUEST", "page and perPage must be positive integers.");
  }
  return { page, perPage };
}

function normalized<T>(items: T[], response: { page: number; per_page: number; total_results: number; next_page?: string }): PaginatedMedia<T> {
  return {
    items,
    page: response.page,
    totalResults: response.total_results,
    hasNextPage: Boolean(response.next_page) || response.page * response.per_page < response.total_results,
  };
}

function errorCode(status: number): MediaSDKErrorCode {
  if (status === 401 || status === 403) return "UNAUTHORIZED";
  if (status === 404) return "NOT_FOUND";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "SERVER_ERROR";
  return "BAD_REQUEST";
}

export class MediaClient extends TypedEventEmitter<MediaClientEvents> {
  readonly #apiKey: string;
  readonly #fetch: FetchFunction;
  readonly #cacheTtlMs: number;
  readonly #cache = new Map<string, CacheEntry>();
  readonly #inFlight = new Map<string, Promise<unknown>>();

  constructor(options: MediaClientOptions) {
    super();
    if (!options.apiKey.trim()) {
      throw new MediaSDKError("UNAUTHORIZED", "An API key is required.");
    }
    this.#apiKey = options.apiKey;
    this.#fetch = options.fetch ?? globalFetch();
    this.#cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;

    const logEvent = (event: keyof MediaClientEvents) => (payload: MediaClientEvents[typeof event]) => {
      console.log(event, payload);
    };
    super.on("download", logEvent("download"));
    super.on("view", logEvent("view"));
  }

  async searchPhotos(query: string, options: PaginationOptions = {}): Promise<PaginatedMedia<PexelsPhoto>> {
    const { page, perPage } = pagination(options);
    const response = await this.#request<PexelsPhotoPage>(`${PHOTO_API_URL}/search`, { query, page, per_page: perPage });
    return normalized(response.photos, response);
  }

  async searchVideos(query: string, options: PaginationOptions = {}): Promise<PaginatedMedia<PexelsVideo>> {
    const { page, perPage } = pagination(options);
    const response = await this.#request<PexelsVideoPage>(`${VIDEO_API_URL}/search`, { query, page, per_page: perPage });
    return normalized(response.videos, response);
  }

  async curatedPhotos(options: PaginationOptions = {}): Promise<PaginatedMedia<PexelsPhoto>> {
    const { page, perPage } = pagination(options);
    const response = await this.#request<PexelsPhotoPage>(`${PHOTO_API_URL}/curated`, { page, per_page: perPage });
    return normalized(response.photos, response);
  }

  getPhoto(id: number | string): Promise<PexelsPhoto> {
    return this.#request<PexelsPhoto>(`${PHOTO_API_URL}/photos/${encodeURIComponent(String(id))}`);
  }

  getVideo(id: number | string): Promise<PexelsVideo> {
    return this.#request<PexelsVideo>(`${VIDEO_API_URL}/videos/${encodeURIComponent(String(id))}`);
  }

  async #request<T>(baseUrl: string, parameters: Record<string, string | number> = {}): Promise<T> {
    const url = new URL(baseUrl);
    for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, String(value));
    const cacheKey = `GET:${url.toString()}`;
    const cached = this.#cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value as T;
    if (cached) this.#cache.delete(cacheKey);

    const existing = this.#inFlight.get(cacheKey);
    if (existing) return existing as Promise<T>;

    const request = this.#performRequest<T>(url.toString())
      .then((value) => {
        this.#cache.set(cacheKey, { value, expiresAt: Date.now() + this.#cacheTtlMs });
        return value;
      })
      .finally(() => this.#inFlight.delete(cacheKey));
    this.#inFlight.set(cacheKey, request);
    return request;
  }

  async #performRequest<T>(url: string): Promise<T> {
    try {
      const response = await this.#fetch(url, { method: "GET", headers: { Authorization: this.#apiKey } });
      if (!response.ok) {
        const code = errorCode(response.status);
        throw new MediaSDKError(code, `Pexels request failed with status ${response.status}.`, { status: response.status });
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof MediaSDKError) throw error;
      throw new MediaSDKError("NETWORK_ERROR", "The Pexels request could not be completed.", { cause: error });
    }
  }
}
