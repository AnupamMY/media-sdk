# media-sdk

Headless media SDK organized as a pnpm workspace. Dependency direction is enforced by dependency-cruiser: applications consume platform wrappers, wrappers consume `media-core`, and UI packages remain independent.

## Wrapper API design

`media-react` and `media-native` expose one hook per operation:

- `usePhotoSearch(query, options)`
- `useVideoSearch(query, options)`
- `useCuratedPhotos(options)`
- `usePhoto(id)` and `useVideo(id)`
- `useMediaEvents(handlers)` and `useMediaTracking()`

Endpoint-specific hooks were chosen over a public generic query hook so query arguments and returned media types remain explicit and infer naturally at call sites. A private generic state adapter handles the shared loading, error, cancellation, and pagination mechanics.

The wrappers only manage component lifecycle state. Pagination calls are delegated to `MediaClient`, and pages are appended for rendering. Request caching, in-flight deduplication, API response normalization, authentication, and HTTP error mapping remain in `media-core`.

```tsx
<MediaProvider apiKey={apiKey}>
  <App />
</MediaProvider>
```

Both wrappers intentionally have the same contract. There is currently no native-only branch because providers and hooks require only React context and lifecycle APIs; neither wrapper handles platform UI events.

## Deployed sites

GitHub Pages publishes each deliverable at its own path. Replace `<github-owner>` and `<repository>` with the repository coordinates after pushing:

- Web app: `https://<github-owner>.github.io/<repository>/app/`
- TypeDoc API documentation: `https://<github-owner>.github.io/<repository>/docs/`
- Storybook: `https://<github-owner>.github.io/<repository>/storybook/`

The deployment requires a repository Actions secret named `VITE_PEXELS_API_KEY` and GitHub Pages configured to use GitHub Actions as its source.
"# media-sdk" 
