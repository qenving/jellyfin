# Public Readiness Assessment

## Current Capabilities
- **Local catalog ingestion.** `AnimeCatalogService` scans the folder defined by `ANIME_LIBRARY_PATH` (default `/media/anime`) and extracts anime, episodes, and subtitles before persisting them into `data/anime_catalog.db`.
- **On-demand rescans and browsing APIs.** `AnimeCatalogController` exposes authenticated REST endpoints for scanning, listing series, retrieving episode metadata, and streaming content plus subtitles.
- **Lightweight web UI.** The controller serves a responsive HTML page that consumes the REST endpoints for playback without requiring extra build tooling.

## Operational Requirements
- **Filesystem layout.** The Jellyfin host must mount the anime library at `/media/anime` (or provide a different path via `ANIME_LIBRARY_PATH`). Missing folders cause scans to clear the catalog, so ensure the directory is reachable before enabling public access.
- **FFmpeg/FFprobe availability.** Thumbnail generation depends on the `ffmpeg` binary being present on the PATH; if it is absent, the service logs a warning and skips thumbnail capture, leaving affected series without artwork. Install Jellyfin with bundled FFmpeg or supply system packages on production servers.
- **Authentication perimeter.** All API endpoints require Jellyfin authentication except the `AnimeCatalog/ui` page, which is anonymous. Place the UI behind your reverse proxy’s auth (or restrict the route) before exposing the site publicly to prevent anonymous scraping.

## Remaining Gaps Before Production Launch
1. **Video licensing compliance.** Ensure you have legal rights to publicly stream the anime files you host. The project does not implement DRM or license enforcement.
2. **Scalability testing.** The SQLite catalog and simple controller have not been load-tested. For a commercial deployment, validate concurrency limits, streaming throughput, and database contention under realistic traffic.
3. **Monitoring & Alerts.** Add service health checks, log aggregation, and ffmpeg process monitoring so administrators are alerted when thumbnail capture or scans fail.
4. **UI Hardening.** The shipped HTML UI lacks rate limiting, CSRF protection, and localization. Consider replacing it with a full React/Vite or Next.js frontend before marketing the platform publicly.
5. **Backup strategy.** Schedule recurring backups for `data/anime_catalog.db`, the Jellyfin configuration directory, and the media library itself to avoid data loss.

## Recommended Next Steps
- Run end-to-end scans and playback tests on a staging server that mirrors production hardware.
- Configure HTTPS termination (e.g., via Nginx/Cloudflare) and review TLS certificates before opening public access.
- Document operational runbooks covering library ingestion, troubleshooting missing artwork, and recovering from database corruption.
