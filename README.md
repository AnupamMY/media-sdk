# media-sdk

Headless media SDK organized as a pnpm workspace. Dependency direction is enforced by dependency-cruiser: applications consume platform wrappers, wrappers consume `media-core`, and UI packages remain small and focused.

## Wrapper API design

`media-react` and `media-native` expose one hook per operation:

- `usePhotoSearch(query, options)`
- `useVideoSearch(query, options)`
- `useCuratedPhotos(options)`
- `usePhoto(id)` and `useVideo(id)`
- `useMediaEvents(handlers)` and `useMediaTracking()`

Endpoint-specific hooks were chosen over a public generic query hook so query arguments and returned media types remain explicit and infer naturally at call sites. A private generic state adapter handles caching and pagination.

The wrappers only manage component lifecycle state. Pagination calls are delegated to `MediaClient`, and pages are appended for rendering. Request caching, in-flight deduplication, API response normalization, and telemetry are handled centrally.

```tsx
<MediaProvider apiKey={apiKey}>
  <App />
</MediaProvider>
```

Both wrappers intentionally have the same contract. There is currently no native-only branch because providers and hooks require only React context and lifecycle APIs; neither wrapper handles platform-specific rendering.

## Deployed sites

GitHub Pages publishes each deliverable at its own path. Replace `<github-owner>` and `<repository>` with the repository coordinates after pushing:

- Web app: `https://<github-owner>.github.io/<repository>/app/`
- TypeDoc API documentation: `https://<github-owner>.github.io/<repository>/docs/`
- Storybook: `https://<github-owner>.github.io/<repository>/storybook/`

The deployment requires a repository Actions secret named `VITE_PEXELS_API_KEY` and GitHub Pages configured to use GitHub Actions as its source.

## Deploying to Vercel

This repository is a pnpm workspace. The web app is located at `apps/web-app` and depends on other workspace packages. To deploy the web app on Vercel, use the following settings:

- Project Root: repository root (leave empty)
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm --filter @media-sdk/web-app... build` (the trailing `...` builds workspace dependencies first)
- Output Directory: `apps/web-app/dist`
- Node version: use Node 20 (there is an .nvmrc at the repo root)

The root `vercel.json` declares the Vite framework, frozen pnpm install, filtered web-app build, and `apps/web-app/dist` output. If you configure overrides in the Vercel UI, keep them identical to the settings above.

### Environment variables

- Required: `VITE_PEXELS_API_KEY`
  - Add this in Vercel under Project Settings → Environment Variables.
  - Add separately for Production and Preview if needed.
  - Do NOT commit real API keys to the repository. Keep `.env.example` as an example only.

### Local test before deploying

- `pnpm install`
- `pnpm --filter @media-sdk/web-app build`
- `ls apps/web-app/dist`
