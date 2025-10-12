# Frontend Notes – Lightweight Anime Catalog UI

## Objectives
- Provide a no-build, zero-dependency UI that immediately reflects the contents of `/media/anime`.
- Ensure the layout feels modern (grid of cards, detail drawer, HTML5 video playback) while staying simple enough to ship inside the Jellyfin process.
- Keep the implementation framework-agnostic so teams can later replace it with React/Next.js without changing backend contracts.

## Current Implementation
- Served from `GET /AnimeCatalog/ui`.
- Fetches catalog data using the REST endpoints exposed by `AnimeCatalogController`.
- Renders a responsive CSS grid with cover art and uses JavaScript to load series details on demand.
- HTML5 `<video>` element streams files directly from `/AnimeCatalog/episodes/{id}/stream` and attaches subtitles by adding `<track>` sources.

### Interaction Flow
1. Page load -> fetch `/AnimeCatalog` to populate the grid.
2. User clicks a title -> fetch `/AnimeCatalog/{id}` to get episodes and subtitles.
3. Selecting an episode sets the `video.src` to the streaming endpoint and appends subtitle tracks.
4. Browser handles playback; Jellyfin manages transcoding as needed.

## Styling Notes
- Uses CSS variables and dark background to mimic contemporary anime portals.
- Layout adapts to mobile through media queries (`max-width: 768px`).
- Cards elevate on hover using box-shadow transitions.

## Future Enhancements
- Add search/filter controls that query the existing REST API (filtering could happen client-side thanks to the small payloads).
- Display duration, subtitle languages, and file size per episode.
- Integrate Jellyfin authentication tokens automatically so the UI works when hosted behind secure proxies.
- Replace inline HTML with a dedicated SPA bundle compiled via Vite and served as static files from Jellyfin or a CDN.
