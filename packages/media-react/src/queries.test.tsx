// @vitest-environment jsdom
import { createElement, type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MediaProvider, MediaSDKError, usePhotoSearch } from "./index";

const photo = (id: number) => ({
  id,
  width: 1200,
  height: 800,
  url: `https://www.pexels.com/photo/${id}`,
  photographer: "Photographer",
  photographer_url: "https://www.pexels.com/@photographer",
  photographer_id: 7,
  avg_color: "#ffffff",
  src: {
    original: `https://images.pexels.com/${id}/original.jpg`,
    large2x: `https://images.pexels.com/${id}/large2x.jpg`,
    large: `https://images.pexels.com/${id}/large.jpg`,
    medium: `https://images.pexels.com/${id}/medium.jpg`,
    small: `https://images.pexels.com/${id}/small.jpg`,
    portrait: `https://images.pexels.com/${id}/portrait.jpg`,
    landscape: `https://images.pexels.com/${id}/landscape.jpg`,
    tiny: `https://images.pexels.com/${id}/tiny.jpg`,
  },
  liked: false,
  alt: `Photo ${id}`,
});

function wrapper({ children }: PropsWithChildren) {
  return createElement(MediaProvider, { apiKey: "test-key", children });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("media query hooks", () => {
  it("exposes fetched data and appends the next page", async () => {
    const fetch = vi.fn(async (input: string) => {
      const page = new URL(input).searchParams.get("page");
      const body = page === "2"
        ? { page: 2, per_page: 1, photos: [photo(2)], total_results: 2 }
        : { page: 1, per_page: 1, photos: [photo(1)], total_results: 2, next_page: "page-2" };
      return { ok: true, status: 200, json: async () => body };
    });
    vi.stubGlobal("fetch", fetch);

    const { result } = renderHook(() => usePhotoSearch("nature", { perPage: 1 }), { wrapper });
    await waitFor(() => expect(result.current.data.map(({ id }) => id)).toEqual([1]));
    expect(result.current.hasNextPage).toBe(true);

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.data.map(({ id }) => id)).toEqual([1, 2]));
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("surfaces a typed MediaSDKError", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) })));

    const { result } = renderHook(() => usePhotoSearch("private"), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeInstanceOf(MediaSDKError);
    expect(result.current.error).toMatchObject({ code: "UNAUTHORIZED", status: 401 });
    expect(result.current.data).toEqual([]);
  });
});
