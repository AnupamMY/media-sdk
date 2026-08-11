import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MediaProvider } from "@media-sdk/media-react";
import { App } from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Missing #root element.");

const apiKey = import.meta.env.VITE_PEXELS_API_KEY || "f2qTKVj3lTVmpX9hgZDi0pNZkyjH3hvwObl0jGKExkV4Z4dktixUMyjd";
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    {apiKey
      ? <MediaProvider apiKey={apiKey}><App /></MediaProvider>
      : <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-12">
          <section className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-slate-950">Media SDK demo</h1>
            <p className="mt-4 leading-7 text-slate-700">Copy <code className="rounded bg-white px-1.5 py-0.5">.env.example</code> to <code className="rounded bg-white px-1.5 py-0.5">.env.local</code> and set <code className="rounded bg-white px-1.5 py-0.5">VITE_PEXELS_API_KEY</code>.</p>
          </section>
        </main>}
  </StrictMode>,
);
