# Jellyfin Anime Edition – Local Library Architecture

## Overview
This architecture describes how the Jellyfin Anime Edition build relies solely on the local filesystem for anime metadata. The platform reads `/media/anime`, builds a lightweight SQLite catalog, and exposes new endpoints plus a minimal HTML client for browsing and playback. No external metadata services or seeded JSON datasets are required.

## Core Components

| Component | Responsibility | Technology |
|-----------|----------------|------------|
| AnimeCatalogService | Scans `/media/anime`, extracts episodes, subtitles, and artwork, stores results in SQLite. | C#, `Microsoft.Data.Sqlite` |
| AnimeCatalogController | REST API to trigger scans, fetch series/episodes, stream video and subtitles, and serve the lightweight UI. | ASP.NET Core MVC |
| Anime Catalog UI | Static HTML/CSS/JS served from `/AnimeCatalog/ui` that displays the scanned catalog in a responsive grid and launches playback. | Vanilla HTML + JS |
| Jellyfin Core | Provides authentication, transcoding, and traditional media library services alongside the anime catalog. | Jellyfin server |

## Data Flow

1. **Scan Trigger** – An admin invokes `POST /AnimeCatalog/scan` (or the server triggers it during startup). The catalog service enumerates `/media/anime`.
2. **Series Assembly** – Each top-level folder becomes an anime series. Video files inside generate episode entries. Subtitle files matching the episode file name are linked automatically.
3. **Cover Resolution** – Artwork is taken from `cover.jpg`/`poster.png` inside the folder. If none exist, the service captures the fifth second of the first episode using `ffmpeg` and stores it in the data directory.
4. **Persistence** – Discovered series, episodes, and subtitles are stored in `data/anime_catalog.db` with deterministic GUID identifiers so repeated scans keep stable IDs.
5. **Client Consumption** – The UI and API return catalog data directly from SQLite. Episode playback streams the original file path with HTTP range support and optional subtitles.

## Storage Layout Expectations

```
/media/anime
  ├── One Piece
  │   ├── Episode 01.mp4
  │   └── Episode 01.ass
  └── Frieren Beyond Journey's End
      ├── S01E01 - The Adventure.mkv
      ├── S01E02 - The Funeral.mkv
      └── cover.jpg
```

The scan treats every immediate child folder as a standalone anime. Nested seasons are optional—videos are sorted alphabetically when season folders are not used.

## Catalog Schema

```
Table anime (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  folder_path TEXT NOT NULL,
  cover_path TEXT,
  episode_count INTEGER NOT NULL
);

Table episode (
  id TEXT PRIMARY KEY,
  anime_id TEXT NOT NULL,
  episode_number TEXT NOT NULL,
  file_path TEXT NOT NULL,
  duration_seconds REAL,
  sort_index INTEGER NOT NULL,
  FOREIGN KEY (anime_id) REFERENCES anime(id) ON DELETE CASCADE
);

Table subtitle (
  id TEXT PRIMARY KEY,
  anime_id TEXT NOT NULL,
  episode_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  format TEXT,
  display_name TEXT NOT NULL,
  FOREIGN KEY (anime_id) REFERENCES anime(id) ON DELETE CASCADE,
  FOREIGN KEY (episode_id) REFERENCES episode(id) ON DELETE CASCADE
);
```

## Security & Compatibility

- All API endpoints inherit Jellyfin authentication except the static HTML UI which can be proxied behind authentication as needed.
- Playback uses Jellyfin's standard range streaming so existing transcoding policies apply automatically.
- Because IDs are deterministic (hashed from paths), the catalog remains stable across rescans even if the SQLite file is recreated.

## Extensibility

- Additional metadata (synopsis, genres) can be populated later by augmenting the scanner to read local sidecar files (e.g., `.nfo`).
- The UI is intentionally simple and can be replaced by a React or Next.js application that calls the same REST endpoints.
- Multiple library roots can be supported by extending the service to read a list of base paths from configuration or environment variables.
