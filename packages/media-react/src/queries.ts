import { useCallback, useEffect, useRef, useState } from "react";
import {
  MediaSDKError,
  type PaginatedMedia,
  type PaginationOptions,
  type PexelsPhoto,
  type PexelsVideo,
} from "@media-sdk/media-core";
import { useMediaClient } from "./context";

export interface PaginatedQueryResult<T> {
  data: T[];
  loading: boolean;
  error: MediaSDKError | null;
  hasNextPage: boolean;
  loadMore(): void;
}

export interface ItemQueryResult<T> {
  data: T | undefined;
  loading: boolean;
  error: MediaSDKError | null;
}

type PageFetcher<T> = (page: number) => Promise<PaginatedMedia<T>>;

function usePaginatedQuery<T>(fetchPage: PageFetcher<T>, initialPage: number): PaginatedQueryResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<MediaSDKError | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const pageRef = useRef(0);
  const loadingRef = useRef(false);
  const generationRef = useRef(0);

  const fetchAndStore = useCallback(async (page: number, append: boolean, generation: number) => {
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPage(page);
      if (generation !== generationRef.current) return;
      setData((current) => append ? [...current, ...result.items] : result.items);
      pageRef.current = result.page;
      setHasNextPage(result.hasNextPage);
    } catch (reason) {
      if (generation === generationRef.current) setError(reason as MediaSDKError);
    } finally {
      if (generation === generationRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [fetchPage]);

  useEffect(() => {
    const generation = ++generationRef.current;
    pageRef.current = 0;
    setData([]);
    setHasNextPage(false);
    void fetchAndStore(initialPage, false, generation);
    return () => { generationRef.current += 1; };
  }, [fetchAndStore, initialPage]);

  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasNextPage) return;
    void fetchAndStore(pageRef.current + 1, true, generationRef.current);
  }, [fetchAndStore, hasNextPage]);

  return { data, loading, error, hasNextPage, loadMore };
}

function useItemQuery<T>(fetchItem: () => Promise<T>, enabled: boolean): ItemQueryResult<T> {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<MediaSDKError | null>(null);

  useEffect(() => {
    let active = true;
    setData(undefined);
    setError(null);
    setLoading(enabled);
    if (!enabled) return () => { active = false; };
    void fetchItem().then(
      (item) => { if (active) setData(item); },
      (reason: unknown) => { if (active) setError(reason as MediaSDKError); },
    ).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [enabled, fetchItem]);

  return { data, loading, error };
}

export function usePhotoSearch(query: string, options: PaginationOptions = {}): PaginatedQueryResult<PexelsPhoto> {
  const client = useMediaClient();
  const page = options.page ?? 1;
  const perPage = options.perPage;
  const fetchPage = useCallback(
    (nextPage: number) => client.searchPhotos(query, { page: nextPage, perPage }),
    [client, perPage, query],
  );
  return usePaginatedQuery(fetchPage, page);
}

export function useVideoSearch(query: string, options: PaginationOptions = {}): PaginatedQueryResult<PexelsVideo> {
  const client = useMediaClient();
  const page = options.page ?? 1;
  const perPage = options.perPage;
  const fetchPage = useCallback(
    (nextPage: number) => client.searchVideos(query, { page: nextPage, perPage }),
    [client, perPage, query],
  );
  return usePaginatedQuery(fetchPage, page);
}

export function useCuratedPhotos(options: PaginationOptions = {}): PaginatedQueryResult<PexelsPhoto> {
  const client = useMediaClient();
  const page = options.page ?? 1;
  const perPage = options.perPage;
  const fetchPage = useCallback(
    (nextPage: number) => client.curatedPhotos({ page: nextPage, perPage }),
    [client, perPage],
  );
  return usePaginatedQuery(fetchPage, page);
}

export function usePhoto(id: number | string | undefined): ItemQueryResult<PexelsPhoto> {
  const client = useMediaClient();
  const fetchItem = useCallback(() => client.getPhoto(id!), [client, id]);
  return useItemQuery(fetchItem, id !== undefined);
}

export function useVideo(id: number | string | undefined): ItemQueryResult<PexelsVideo> {
  const client = useMediaClient();
  const fetchItem = useCallback(() => client.getVideo(id!), [client, id]);
  return useItemQuery(fetchItem, id !== undefined);
}
