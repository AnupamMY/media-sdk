import { afterEach, describe, expect, it, vi } from "vitest";
import { MediaClient, MediaSDKError, type FetchFunction, type PexelsPhoto } from "./index";

const photo: PexelsPhoto = {
  id: 42,
  width: 1200,
  height: 800,
  url: "https://www.pexels.com/photo/42",
  photographer: "Photographer",
  photographer_url: "https://www.pexels.com/@photographer",
  photographer_id: 7,
  avg_color: "#ffffff",
  src: {
    original: "https://images.pexels.com/42/original.jpg",
    large2x: "https://images.pexels.com/42/large2x.jpg",
    large: "https://images.pexels.com/42/large.jpg",
    medium: "https://images.pexels.com/42/medium.jpg",
    small: "https://images.pexels.com/42/small.jpg",
    portrait: "https://images.pexels.com/42/portrait.jpg",
    landscape: "https://images.pexels.com/42/landscape.jpg",
    tiny: "https://images.pexels.com/42/tiny.jpg",
  },
  liked: false,
  alt: "A test photo",
};

function successfulFetch(body: unknown): FetchFunction {
  return vi.fn<FetchFunction>(async () => ({ ok: true, status: 200, json: async () => body }));
}

afterEach(() => vi.restoreAllMocks());

describe("MediaClient pagination", () => {
  it("normalizes a Pexels photo page", async () => {
    const fetch = successfulFetch({ page: 2, per_page: 10, photos: [photo], total_results: 21 });
    const client = new MediaClient({ apiKey: "secret", fetch });

    await expect(client.searchPhotos("mountains", { page: 2, perPage: 10 })).resolves.toEqual({
      items: [photo],
      page: 2,
      totalResults: 21,
      hasNextPage: true,
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.pexels.com/v1/search?query=mountains&page=2&per_page=10",
      { method: "GET", headers: { Authorization: "secret" } },
    );
  });
});

describe("MediaClient request cache", () => {
  it("deduplicates concurrent requests and caches completed responses", async () => {
    let resolveResponse: ((value: { ok: true; status: number; json(): Promise<unknown> }) => void) | undefined;
    const fetch = vi.fn<FetchFunction>(() => new Promise((resolve) => { resolveResponse = resolve; }));
    const client = new MediaClient({ apiKey: "secret", fetch, cacheTtlMs: 60_000 });

    const first = client.getPhoto(42);
    const second = client.getPhoto(42);
    expect(fetch).toHaveBeenCalledTimes(1);

    resolveResponse?.({ ok: true, status: 200, json: async () => photo });
    await expect(Promise.all([first, second])).resolves.toEqual([photo, photo]);
    await expect(client.getPhoto(42)).resolves.toEqual(photo);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe("MediaClient errors", () => {
  it.each([
    [401, "UNAUTHORIZED"],
    [429, "RATE_LIMITED"],
  ] as const)("maps HTTP %s to %s", async (status, code) => {
    const fetch = vi.fn<FetchFunction>(async () => ({ ok: false, status, json: async () => ({}) }));
    const client = new MediaClient({ apiKey: "secret", fetch });

    const error = await client.getPhoto(42).catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(MediaSDKError);
    expect(error).toMatchObject({ code, status });
  });
});

describe("MediaClient events", () => {
  it("supports multiple subscribers and keeps its default listener", () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const client = new MediaClient({ apiKey: "secret", fetch: successfulFetch(photo) });
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribeFirst = client.on("view", first);
    client.on("view", second);
    const payload = { id: 42, type: "photo" } as const;

    client.emit("view", payload);
    unsubscribeFirst();
    client.emit("view", payload);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
    expect(consoleLog).toHaveBeenCalledTimes(2);
    expect(consoleLog).toHaveBeenNthCalledWith(1, "view", payload);
    expect(consoleLog).toHaveBeenNthCalledWith(2, "view", payload);
  });
});
