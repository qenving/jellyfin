# Deployment Guide – Local Anime Catalog

## Prerequisites
- Ubuntu/Debian host with Docker or bare-metal Jellyfin installation.
- Anime files placed under a directory that can be mounted at `/media/anime` inside the Jellyfin container or accessible on the host for bare-metal installs.
- Optional: `ffmpeg` and `ffprobe` available on the PATH for thumbnail/duration extraction.

## Containerized Setup

1. Copy `deployment/docker-compose.anime.yml` and create an `.env` file with:
   ```
   JELLYFIN_IMAGE=jellyfin/jellyfin:latest
   TZ=Asia/Jakarta
   ANIME_LIBRARY_PATH=/media/anime
   ```
2. Ensure you have the following directories on the host:
   - `config/` – Jellyfin configuration
   - `data/anime/` – Your anime library (will be mounted read-only or read-write as needed)
   - `data/transcoded/` – Optional cache for Jellyfin transcodes
   - `backups/` – Storage for SQLite backups and Jellyfin configs
3. Launch with `docker compose -f deployment/docker-compose.anime.yml up -d`.
4. Access Jellyfin at `http://localhost:8096`. Trigger a scan via `POST /AnimeCatalog/scan` or by adding a scheduled task.

## Bare-Metal Setup (Linux)

1. Install Jellyfin using the official packages.
2. Set the environment variable `ANIME_LIBRARY_PATH=/path/to/your/anime` for the Jellyfin service (e.g., in `/etc/systemd/system/jellyfin.service.d/override.conf`).
3. Restart Jellyfin: `sudo systemctl daemon-reload && sudo systemctl restart jellyfin`.
4. Trigger the catalog scan via the REST endpoint or by adding an automation script:
   ```bash
   curl -X POST -H "X-Emby-Token: <API_TOKEN>" http://localhost:8096/AnimeCatalog/scan
   ```

## Backup Strategy
- The SQLite catalog lives under `<JellyfinData>/anime_catalog.db`.
- Back up the database and generated `anime_covers/` directory alongside Jellyfin config backups.
- A simple cron job can copy these files nightly:
  ```bash
  0 3 * * * rsync -a /var/lib/jellyfin/data/anime_catalog.db /srv/backups/jellyfin/
  5 3 * * * rsync -a /var/lib/jellyfin/data/anime_covers/ /srv/backups/jellyfin/anime_covers/
  ```

## Operational Tips
- Re-run the scan whenever new files are added. The process is idempotent and quick because it only walks the filesystem.
- Monitor logs for messages tagged `AnimeCatalogService` to confirm thumbnail/duration extraction success.
- If FFmpeg is unavailable, remove it from the PATH or ignore warnings—the service will continue without generated thumbnails.

## Windows Deployment

The Jellyfin Anime Edition stack also works on Windows hosts. The key tasks are
installing the standard Jellyfin package, pointing the catalog scanner at your
anime library, and ensuring FFmpeg is available for thumbnail extraction.

1. **Install Jellyfin** using the latest Windows installer from the official
   downloads page. During setup, allow the service to start automatically.
2. **Prepare the library** by placing your anime under a single parent folder,
   for example `D:\Media\Anime`. Keep existing cover images (`cover.jpg`,
   `poster.png`) and subtitles (`.srt`, `.ass`) next to their episodes.
3. **Set the environment variable** `ANIME_LIBRARY_PATH` so the Windows service
   can find the library:
   - Open **Start → Environment Variables**.
   - Add a new *System variable* named `ANIME_LIBRARY_PATH` with the absolute
     path to your anime directory (e.g., `D:\Media\Anime`).
   - Restart the `Jellyfin` service from *Services.msc* to apply the change.
4. **Install FFmpeg** by downloading the Windows build from
   <https://ffmpeg.org/download.html>. Extract it and add the `bin` directory
   (containing `ffmpeg.exe` and `ffprobe.exe`) to the system `PATH` so the
   catalog service can create thumbnails and read durations.
5. **Trigger the initial scan** after the service restarts:
   - Open a terminal and run:
     ```powershell
     $headers = @{ 'X-Emby-Token' = '<API_TOKEN>' }
     Invoke-RestMethod -Method Post -Uri "http://localhost:8096/AnimeCatalog/scan" -Headers $headers
     ```
   - Alternatively, browse to `http://localhost:8096/AnimeCatalog/ui` while
     signed in as an administrator and click the *Scan Library* button.
6. **Configure backups** by scheduling a Task Scheduler job that copies
   `%ProgramData%\Jellyfin\Server\anime_catalog.db` and the
   `%ProgramData%\Jellyfin\Server\anime_covers` folder to your backup target.

With these steps complete, the Windows deployment offers the same functionality
as the Linux setup: automatic filesystem scanning, subtitle linkage, thumbnail
generation, and playback via the Jellyfin interface.
