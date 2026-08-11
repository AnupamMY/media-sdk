import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useMediaClient,
  usePhotoSearch,
  useVideoSearch,
  type PexelsPhoto,
  type PexelsVideo,
} from "@media-sdk/media-react";
import { useGrid, useLightbox, useReelSwiper, type GridElementProps } from "@media-sdk/media-ui-react";

type ViewMode = "photos" | "reels";

interface LightboxPhoto {
  id: number;
  src: string;
  alt: string;
  downloadUrl: string;
}

function mergeClassNames(...values: Array<string | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function App() {
  const [draftQuery, setDraftQuery] = useState("nature");
  const [query, setQuery] = useState("nature");
  const [mode, setMode] = useState<ViewMode>("photos");

  return <main className="min-h-screen bg-slate-50 font-sans text-slate-800">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Pexels browser</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Headless Media SDK</h1>
          <p className="text-sm text-slate-500">Search photos and browse videos using the SDK’s headless hooks.</p>
        </div>
        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form className="flex w-full max-w-2xl items-center rounded-xl border border-slate-300 bg-white p-1.5 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100" onSubmit={(event) => { event.preventDefault(); setQuery(draftQuery.trim() || "nature"); }}>
            <label className="sr-only" htmlFor="media-search">Search Pexels</label>
            <input className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 outline-none placeholder:text-slate-400" id="media-search" placeholder="Search photos and videos" value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} />
            <button className="shrink-0 rounded-lg bg-blue-700 px-5 py-2 font-semibold text-white transition hover:bg-blue-800" type="submit">Search</button>
          </form>
          <div className="inline-flex w-fit rounded-xl bg-slate-100 p-1" aria-label="Result view">
            <button className="rounded-lg px-4 py-2 text-sm font-semibold transition aria-pressed:bg-white aria-pressed:text-blue-700 aria-pressed:shadow-sm" type="button" aria-pressed={mode === "photos"} onClick={() => setMode("photos")}>Photos</button>
            <button className="rounded-lg px-4 py-2 text-sm font-semibold transition aria-pressed:bg-white aria-pressed:text-blue-700 aria-pressed:shadow-sm" type="button" aria-pressed={mode === "reels"} onClick={() => setMode("reels")}>Video reels</button>
          </div>
        </div>
      </div>
    </header>

    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {mode === "photos" ? <PhotoResults query={query} /> : <VideoReels query={query} />}
    </div>
  </main>;
}


function PhotoResults({ query }: { query: string }) {
  //alert("Anupam");
  const client = useMediaClient();
  const { data, loading, error, hasNextPage, loadMore } = usePhotoSearch(query, { perPage: 12 });
  const [selectedIndex, setSelectedIndex] = useState<number>();
  const onLoadMore = useCallback(() => loadMore(), [loadMore]);
  const grid = useGrid({ items: data, onLoadMore, hasNextPage, loading });
  const gridProps = grid.getGridProps();
  const lightboxItems = useMemo<LightboxPhoto[]>(() => data.map((photo) => ({
    id: photo.id,
    src: photo.src.large2x,
    alt: photo.alt || `Photo by ${photo.photographer}`,
    downloadUrl: photo.src.original,
  })), [data]);

  if (error) return <p className="mt-4 rounded-md bg-red-50 p-3 text-red-800" role="alert">Could not load photos: {error.code}</p>;

  return <section aria-labelledby="photos-heading">
    <div className="mb-5 flex items-end justify-between gap-4">
      <div><p className="text-sm font-medium text-slate-500">Photo results</p><h2 className="text-2xl font-bold text-slate-950" id="photos-heading">{query.toLocaleUpperCase()}</h2></div>
      {data.length > 0 && <span className="text-sm text-slate-500">{data.length} loaded</span>}
    </div>
    <div
      {...gridProps}
      className={mergeClassNames(gridProps.className, "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4")}
    >
      {data.map((photo, index) => {
        const itemProps = grid.getItemProps<HTMLElement>(photo, index, {
          onClick: () => setSelectedIndex(index),
          onKeyDown: (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setSelectedIndex(index);
            }
          },
        });
        return <PhotoCard
          key={photo.id}
          photo={photo}
          itemProps={itemProps}
          onDownload={() => client.emit("download", { id: photo.id, type: "photo" })}
        />;
      })}
    </div>
    {loading && <p className="py-4" aria-live="polite">Loading photos…</p>}
    <div ref={grid.sentinelRef} className="h-0.5" aria-hidden="true" />
    {selectedIndex !== undefined && lightboxItems[selectedIndex] && <PhotoLightbox
      items={lightboxItems}
      initialIndex={selectedIndex}
      onClose={() => setSelectedIndex(undefined)}
    />}
  </section>;
}

function PhotoCard({ photo, itemProps, onDownload }: {
  photo: PexelsPhoto;
  itemProps: GridElementProps<HTMLElement>;
  onDownload(): void;
}) {
  return <article
    {...itemProps}
    className={mergeClassNames(
      itemProps.className,
      "group grid min-w-0 cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white shadow transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600",
    )}
  >
    <div className="aspect-square overflow-hidden bg-slate-100"><img className="h-full w-full rounded-t-lg object-cover transition duration-300 group-hover:scale-105" src={photo.src.medium} alt={photo.alt} loading="lazy" /></div>
    <div className="flex min-w-0 items-center justify-between gap-3 p-3.5">
      <span className="truncate text-sm font-medium text-slate-700">{photo.photographer}</span>
      <a className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700" href={photo.src.original} download target="_blank" rel="noreferrer" onClick={(event) => { event.stopPropagation(); onDownload(); }}>Download</a>
    </div>
  </article>;
}

function PhotoLightbox({ items, initialIndex, onClose }: { items: LightboxPhoto[]; initialIndex: number; onClose(): void }) {
  const client = useMediaClient();
  const lightbox = useLightbox({ items, initialIndex, onClose });
  useEffect(() => {
    if (lightbox.currentItem) client.emit("view", { id: lightbox.currentItem.id, type: "photo" });
  }, [client, lightbox.currentItem?.id]);

  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/90 p-3 backdrop-blur-sm sm:p-6">
    <div {...lightbox.getOverlayProps({ className: "grid max-h-[95vh] w-full max-w-5xl gap-4 rounded-2xl bg-white p-3 shadow-2xl sm:p-5" })}>
      <div className="grid min-h-0 place-items-center overflow-hidden rounded-xl bg-slate-950"><img {...lightbox.getImageProps({ className: "max-h-[72vh] max-w-full object-contain" })} /></div>
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <button className="rounded border border-slate-400 px-3 py-2 disabled:opacity-40" {...lightbox.getPrevButtonProps()}>Previous</button>
        <a className="font-medium text-blue-700 underline" href={lightbox.currentItem?.downloadUrl} download target="_blank" rel="noreferrer" onClick={() => {
          if (lightbox.currentItem) client.emit("download", { id: lightbox.currentItem.id, type: "photo" });
        }}>Download</a>
        <button className="rounded border border-slate-400 px-3 py-2 disabled:opacity-40" {...lightbox.getNextButtonProps()}>Next</button>
        <button className="rounded bg-slate-800 px-3 py-2 text-white" {...lightbox.getCloseButtonProps()}>Close</button>
      </div>
    </div>
  </div>;
}

function VideoReels({ query }: { query: string }) {
  const client = useMediaClient();
  const { data, loading, error, hasNextPage, loadMore } = useVideoSearch(query, { perPage: 8 });
  const onActiveChange = useCallback((video: PexelsVideo) => client.emit("view", { id: video.id, type: "video" }), [client]);
  const reel = useReelSwiper({ items: data, onActiveChange });

  if (error) return <p className="mt-4 rounded-md bg-red-50 p-3 text-red-800" role="alert">Could not load videos: {error.code}</p>;

  return <section aria-labelledby="reels-heading">
    <div className="mb-5"><p className="text-sm font-medium text-slate-500">Video results</p><h2 className="text-2xl font-bold text-slate-950" id="reels-heading">Reels for “{query}”</h2></div>
    <div className="mx-auto max-w-xl overflow-hidden rounded-2xl bg-slate-950 shadow-xl">
      <div {...reel.getContainerProps({ className: "h-[72vh] bg-slate-950" })}>
      {data.map((video, index) => {
        const source = video.video_files.find((file) => file.quality === "hd") ?? video.video_files[0];
        return <article key={video.id} {...reel.getItemProps(video, index, { className: "relative grid min-h-[72vh] place-items-center" })}>
          {source && <ReelVideo src={source.link} poster={video.image} active={index === reel.activeIndex} />}
          <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/65 p-3 text-white backdrop-blur-sm">
            <span>Video #{video.id}</span>
            {source && <a className="underline" href={source.link} download target="_blank" rel="noreferrer" onClick={() => client.emit("download", { id: video.id, type: "video" })}>Download</a>}
          </div>
        </article>;
      })}
      </div>
    </div>
    {loading && <p className="py-4" aria-live="polite">Loading videos…</p>}
    {hasNextPage && !loading && <button className="mt-4 rounded-md bg-blue-700 px-4 py-2 font-medium text-white" type="button" onClick={loadMore}>Load more reels</button>}
  </section>;
}

function ReelVideo({ src, poster, active }: { src: string; poster: string; active: boolean }) {
  const [element, setElement] = useState<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (!element) return;
    if (active) void element.play().catch(() => undefined);
    else element.pause();
  }, [active, element]);
  return <video className="h-[72vh] w-full object-contain" ref={setElement} src={src} poster={poster} muted loop playsInline controls />;
}
