# Backend Notes – Local Anime Catalog

## Goals
- Populate anime metadata exclusively from the filesystem under `/media/anime`.
- Persist scanned data so the UI can perform fast lookups without rescanning.
- Reuse Jellyfin's streaming and authentication stack while keeping the feature set self-contained.

## Key Services

### AnimeCatalogService
- Scans the configured library root (`ANIME_LIBRARY_PATH` environment variable or `/media/anime`).
- Uses `IFileSystem` to enumerate directories and files so existing Jellyfin abstractions (remote storage, SMB, etc.) continue working.
- Stores results in `anime_catalog.db` located in the Jellyfin data directory.
- Generates deterministic GUIDs for series/episodes/subtitles using the full path string.
- Optional FFmpeg/FFprobe integration:
  - `ffprobe` measures episode durations when available.
  - `ffmpeg` captures thumbnails for series lacking local artwork.
- Supports concurrent access by guarding scans with `SemaphoreSlim` and enabling WAL mode in SQLite.

### Database Schema Lifecycle
- Schema initialization happens lazily on the first request.
- `EnsureDatabaseAsync` creates tables (`anime`, `episode`, `subtitle`) and sets WAL journaling.
- `PersistCatalogAsync` clears existing rows and inserts the latest scan results within a single transaction.

### API Endpoints (`AnimeCatalogController`)
- `POST /AnimeCatalog/scan` – Triggers a rescan and returns the summary (series count, episodes, generated thumbnails).
- `GET /AnimeCatalog` – Lists all series with cover art paths and episode counts.
- `GET /AnimeCatalog/{id}` – Returns detailed series info including episodes and linked subtitles.
- `GET /AnimeCatalog/episodes/{episodeId}/stream` – Streams the original file with range support.
- `GET /AnimeCatalog/subtitles/{subtitleId}` – Serves subtitle files for the HTML5 player.
- `GET /AnimeCatalog/{id}/cover` – Provides series artwork (local or generated).
- `GET /AnimeCatalog/ui` – Lightweight HTML application for quick browsing.

All routes require Jellyfin authentication except `/AnimeCatalog/ui`, which can remain public or be protected by a reverse proxy.

## Configuration & Environment
- `ANIME_LIBRARY_PATH`: overrides the root directory if your media is stored elsewhere.
- `JELLYFIN_LOG_DIR`: standard Jellyfin logging location; the service writes scan summaries using `ILogger`.
- `PATH`: must include `ffmpeg` and `ffprobe` for thumbnail/duration features. If absent, scans still succeed without those enhancements.

## Error Handling Strategy
- Missing library path: scan clears the catalog and returns a warning message.
- Missing files during playback: controller logs a warning and responds with `404`.
- Thumbnail/duration failures: logged at `Warning` or `Debug` level, never blocking the scan.

## Extending the Scanner
- Add support for nested season folders by traversing multiple directory levels and composing `Season` metadata.
- Read local `.nfo` or `.json` sidecars to enrich synopsis, genres, and ratings while staying offline.
- Persist watch history or favorites by creating additional tables keyed by Jellyfin user IDs.
