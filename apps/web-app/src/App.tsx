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

  return <main className="min-h-screen bg-slate-950 font-sans text-slate-100">
    <header className="border-b border-white/10 bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Pexels browser</p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Headless Media SDK</h1>
          <p className="text-sm text-slate-400">Search photos and browse videos using the SDK’s headless hooks.</p>
        </div>
        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form className="flex w-full max-w-2xl items-center rounded-xl border border-slate-300 bg-white p-1.5 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100" onSubmit={(event) => { event.preventDefault(); setQuery(draftQuery.trim() || "nature"); }}>
            <label className="sr-only" htmlFor="media-search">Search Pexels</label>
            <input className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 outline-none placeholder:text-slate-400" id="media-search" placeholder="Search photos and videos" value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} />
            <button className="shrink-0 rounded-lg bg-blue-700 px-5 py-2 font-semibold text-white transition hover:bg-blue-800" type="submit">Search</button>
          </form>
          <div className="inline-flex w-fit rounded-xl bg-white/10 p-1" aria-label="Result view">
            <button className="rounded-lg px-4 py-2 text-sm font-semibold transition aria-pressed:bg-white aria-pressed:text-blue-700 aria-pressed:shadow-sm" type="button" aria-pressed={mode === "photos"} onClick={() => setMode("photos")}>Photos</button>
            <button className="rounded-lg px-4 py-2 text-sm font-semibold transition aria-pressed:bg-white aria-pressed:text-blue-700 aria-pressed:shadow-sm" type="button" aria-pressed={mode === "reels"} onClick={() => setMode("reels")}>Video reels</button>
          </div>
        </div>
      </div>
    </header>

    <div className={mode === "photos" ? "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" : "w-full"}>
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
      <div><p className="text-sm font-medium text-slate-400">Photo results</p><h2 className="text-2xl font-bold text-white" id="photos-heading">{query.toLocaleUpperCase()}</h2></div>
      {data.length > 0 && <span className="text-sm text-slate-400">{data.length} loaded</span>}
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
      "group grid min-w-0 cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-slate-900 shadow transition hover:-translate-y-0.5 hover:border-white/20 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500",
    )}
  >
    <div className="aspect-square overflow-hidden bg-slate-100"><img className="h-full w-full rounded-t-lg object-cover transition duration-300 group-hover:scale-105" src={photo.src.medium} alt={photo.alt} loading="lazy" /></div>
    <div className="flex min-w-0 items-center justify-between gap-3 p-3.5">
      <span className="truncate text-sm font-medium text-slate-200">{photo.photographer}</span>
      <a className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-blue-600 hover:text-white" href={photo.src.original} download target="_blank" rel="noreferrer" onClick={(event) => { event.stopPropagation(); onDownload(); }}>Download</a>
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
  const onActiveChange = useCallback((video: PexelsVideo, index: number) => {
    client.emit("view", { id: video.id, type: "video" });
    if (hasNextPage && !loading && index >= data.length - 3) loadMore();
  }, [client, data.length, hasNextPage, loadMore, loading]);
  const reel = useReelSwiper({ items: data, onActiveChange });

  if (error) return <p className="mt-4 rounded-md bg-red-50 p-3 text-red-800" role="alert">Could not load videos: {error.code}</p>;

  return <section className="bg-slate-950 lg:bg-transparent" aria-labelledby="reels-heading">
    <h2 className="sr-only" id="reels-heading">Reels for “{query}”</h2>
    <div className="mx-auto w-full max-w-md bg-black">
      <div {...reel.getContainerProps({
        className: "scrollbar-hidden h-[100svh] w-full snap-y snap-mandatory overflow-y-scroll overscroll-contain bg-black",
        "aria-label": `Video reels for ${query}`,
      })}>
      {data.map((video, index) => {
        const source = video.video_files.find((file) => file.quality === "hd") ?? video.video_files[0];
        const active = index === reel.activeIndex;
        return <article key={video.id} {...reel.getItemProps(video, index, {
          className: "relative grid h-[100svh] min-h-[100svh] w-full snap-start snap-always place-items-center overflow-hidden bg-black",
        })}>
          {source && <ReelVideo src={source.link} poster={video.image} active={active} />}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-5 pb-8 pt-28 text-white">
            <div className="pointer-events-auto flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Now viewing</p>
                <p className="mt-1 truncate text-lg font-semibold">Video #{video.id}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {source && <ReelMuteControl active={active} />}
                {source && <a className="rounded-full border border-white/30 bg-black/35 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white hover:text-black" href={source.link} download target="_blank" rel="noreferrer" onClick={() => client.emit("download", { id: video.id, type: "video" })}>Download</a>}
              </div>
            </div>
          </div>
        </article>;
      })}
      {loading && <div className="grid h-20 place-items-center bg-black text-sm text-white/70" aria-live="polite">Loading more reels…</div>}
      </div>
    </div>
  </section>;
}

function ReelVideo({ src, poster, active }: { src: string; poster: string; active: boolean }) {
  const [element, setElement] = useState<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);
  useEffect(() => {
    if (!element) return;
    if (active) void element.play().catch(() => undefined);
    else {
      element.pause();
      setMuted(true);
    }
  }, [active, element]);
  return <>
    <video className="h-full w-full object-cover" ref={setElement} src={src} poster={poster} muted={muted} loop playsInline preload={active ? "auto" : "metadata"} />
    {active && <button
      className="absolute right-4 top-4 z-10 rounded-full border border-white/25 bg-black/45 px-3 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-black/70"
      type="button"
      onClick={() => setMuted((current) => !current)}
      aria-label={muted ? "Unmute video" : "Mute video"}
    >{muted ? "Sound off" : "Sound on"}</button>}
  </>;
}

function ReelMuteControl({ active }: { active: boolean }) {
  return <span className="rounded-full border border-white/20 bg-black/30 px-3 py-2 text-xs text-white/80">
    {active ? "Active" : "Paused"}
  </span>;
}
