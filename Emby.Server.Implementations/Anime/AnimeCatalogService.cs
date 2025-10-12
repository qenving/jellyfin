using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using MediaBrowser.Common.IO;
using MediaBrowser.Controller.Anime;
using MediaBrowser.Controller.Anime.Models;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;

namespace Emby.Server.Implementations.Anime
{
    /// <summary>
    /// Default implementation that scans the filesystem for anime series and persists them into a SQLite catalog.
    /// </summary>
    public class AnimeCatalogService : IAnimeCatalogService
    {
        private static readonly string[] VideoExtensions =
        {
            ".mp4",
            ".mkv",
            ".avi",
            ".mov",
            ".m4v",
            ".webm",
            ".ts"
        };

        private static readonly string[] SubtitleExtensions =
        {
            ".srt",
            ".ass",
            ".ssa",
            ".vtt"
        };

        private static readonly string[] CoverCandidates =
        {
            "cover.jpg",
            "cover.jpeg",
            "cover.png",
            "poster.jpg",
            "poster.jpeg",
            "poster.png",
            "folder.jpg",
            "folder.png"
        };

        private readonly ILogger<AnimeCatalogService> _logger;
        private readonly IFileSystem _fileSystem;
        private readonly SemaphoreSlim _scanGate = new(1, 1);
        private readonly SemaphoreSlim _schemaGate = new(1, 1);
        private readonly string _catalogPath;
        private readonly string _coverOutputPath;
        private readonly string _libraryRoot;
        private bool _databaseInitialized;
        private bool? _ffprobeAvailable;
        private bool? _ffmpegAvailable;

        /// <summary>
        /// Initializes a new instance of the <see cref="AnimeCatalogService"/> class.
        /// </summary>
        public AnimeCatalogService(
            ILogger<AnimeCatalogService> logger,
            IServerApplicationPaths appPaths,
            IFileSystem fileSystem)
        {
            _logger = logger;
            _fileSystem = fileSystem;

            _catalogPath = Path.Combine(appPaths.DataPath, "anime_catalog.db");
            _coverOutputPath = Path.Combine(appPaths.DataPath, "anime_covers");
            Directory.CreateDirectory(_coverOutputPath);

            _libraryRoot = Environment.GetEnvironmentVariable("ANIME_LIBRARY_PATH") ?? "/media/anime";
        }

        /// <inheritdoc />
        public async Task<AnimeScanResult> ScanAsync(CancellationToken cancellationToken)
        {
            await EnsureDatabaseAsync(cancellationToken).ConfigureAwait(false);
            await _scanGate.WaitAsync(cancellationToken).ConfigureAwait(false);
            try
            {
                var messages = new List<string>();
                var series = new List<AnimeSeriesDetail>();
                var episodeCount = 0;
                var thumbnailCount = 0;

                if (!_fileSystem.DirectoryExists(_libraryRoot))
                {
                    var message = $"Anime library path '{_libraryRoot}' does not exist.";
                    _logger.LogWarning(message);
                    messages.Add(message);
                    await ClearCatalogAsync(cancellationToken).ConfigureAwait(false);
                    return new AnimeScanResult
                    {
                        SeriesCount = 0,
                        EpisodeCount = 0,
                        GeneratedThumbnails = 0,
                        Messages = messages
                    };
                }

                foreach (var seriesDirectory in _fileSystem.GetDirectories(_libraryRoot))
                {
                    cancellationToken.ThrowIfCancellationRequested();

                    var detail = await BuildSeriesDetailAsync(seriesDirectory.FullName, cancellationToken).ConfigureAwait(false);
                    if (detail.Episodes.Count == 0)
                    {
                        _logger.LogDebug("Skipping series {Series} because no video files were found.", detail.Title);
                        continue;
                    }

                    series.Add(detail);
                    episodeCount += detail.Episodes.Count;
                    if (detail.CoverImagePath is not null && detail.CoverImagePath.StartsWith(_coverOutputPath, StringComparison.Ordinal))
                    {
                        thumbnailCount++;
                    }
                }

                await PersistCatalogAsync(series, cancellationToken).ConfigureAwait(false);

                var summary = new AnimeScanResult
                {
                    SeriesCount = series.Count,
                    EpisodeCount = episodeCount,
                    GeneratedThumbnails = thumbnailCount,
                    Messages = messages
                };

                _logger.LogInformation("Anime catalog scan finished with {Series} series and {Episodes} episodes.", summary.SeriesCount, summary.EpisodeCount);
                return summary;
            }
            finally
            {
                _scanGate.Release();
            }
        }

        /// <inheritdoc />
        public async Task<IReadOnlyList<AnimeSeries>> GetAnimeAsync(CancellationToken cancellationToken)
        {
            await EnsureDatabaseAsync(cancellationToken).ConfigureAwait(false);

            var results = new List<AnimeSeries>();
            await using var connection = CreateConnection();
            await connection.OpenAsync(cancellationToken).ConfigureAwait(false);

            var command = connection.CreateCommand();
            command.CommandText = "SELECT id, title, folder_path, cover_path, episode_count FROM anime ORDER BY title COLLATE NOCASE";

            await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
            while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            {
                results.Add(new AnimeSeries
                {
                    Id = Guid.Parse(reader.GetString(0)),
                    Title = reader.GetString(1),
                    FolderPath = reader.GetString(2),
                    CoverImagePath = reader.IsDBNull(3) ? null : reader.GetString(3),
                    EpisodeCount = reader.GetInt32(4)
                });
            }

            return results;
        }

        /// <inheritdoc />
        public async Task<AnimeSeriesDetail?> GetAnimeDetailAsync(Guid id, CancellationToken cancellationToken)
        {
            await EnsureDatabaseAsync(cancellationToken).ConfigureAwait(false);

            AnimeSeriesDetail? detail = null;
            var episodes = new List<AnimeEpisode>();

            await using var connection = CreateConnection();
            await connection.OpenAsync(cancellationToken).ConfigureAwait(false);

            var seriesCommand = connection.CreateCommand();
            seriesCommand.CommandText = "SELECT id, title, folder_path, cover_path, episode_count FROM anime WHERE id = $id";
            seriesCommand.Parameters.AddWithValue("$id", id.ToString());

            await using var reader = await seriesCommand.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
            if (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            {
                detail = new AnimeSeriesDetail
                {
                    Id = Guid.Parse(reader.GetString(0)),
                    Title = reader.GetString(1),
                    FolderPath = reader.GetString(2),
                    CoverImagePath = reader.IsDBNull(3) ? null : reader.GetString(3),
                    EpisodeCount = reader.GetInt32(4)
                };
            }

            if (detail is null)
            {
                return null;
            }

            var episodesCommand = connection.CreateCommand();
            episodesCommand.CommandText = @"SELECT e.id, e.anime_id, e.episode_number, e.file_path, e.duration_seconds
                FROM episode e WHERE e.anime_id = $id ORDER BY e.sort_index";
            episodesCommand.Parameters.AddWithValue("$id", id.ToString());

            var subtitleLookup = new Dictionary<Guid, List<AnimeSubtitle>>();

            var subtitlesCommand = connection.CreateCommand();
            subtitlesCommand.CommandText = "SELECT id, episode_id, file_path, format, display_name FROM subtitle WHERE anime_id = $id";
            subtitlesCommand.Parameters.AddWithValue("$id", id.ToString());

            await using (var subtitleReader = await subtitlesCommand.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false))
            {
                while (await subtitleReader.ReadAsync(cancellationToken).ConfigureAwait(false))
                {
                    var subtitle = new AnimeSubtitle
                    {
                        Id = Guid.Parse(subtitleReader.GetString(0)),
                        EpisodeId = Guid.Parse(subtitleReader.GetString(1)),
                        FilePath = subtitleReader.GetString(2),
                        Format = subtitleReader.IsDBNull(3) ? null : subtitleReader.GetString(3),
                        DisplayName = subtitleReader.GetString(4)
                    };

                    if (!subtitleLookup.TryGetValue(subtitle.EpisodeId, out var list))
                    {
                        list = new List<AnimeSubtitle>();
                        subtitleLookup[subtitle.EpisodeId] = list;
                    }

                    list.Add(subtitle);
                }
            }

            await using (var episodeReader = await episodesCommand.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false))
            {
                while (await episodeReader.ReadAsync(cancellationToken).ConfigureAwait(false))
                {
                    var episodeId = Guid.Parse(episodeReader.GetString(0));
                    episodes.Add(new AnimeEpisode
                    {
                        Id = episodeId,
                        AnimeId = Guid.Parse(episodeReader.GetString(1)),
                        EpisodeNumber = episodeReader.GetString(2),
                        FilePath = episodeReader.GetString(3),
                        DurationSeconds = episodeReader.IsDBNull(4) ? null : episodeReader.GetDouble(4),
                        Subtitles = subtitleLookup.TryGetValue(episodeId, out var list) ? list : new List<AnimeSubtitle>()
                    });
                }
            }

            detail.Episodes = episodes;

            return detail;
        }

        /// <inheritdoc />
        public async Task<AnimeEpisode?> GetEpisodeAsync(Guid episodeId, CancellationToken cancellationToken)
        {
            await EnsureDatabaseAsync(cancellationToken).ConfigureAwait(false);

            await using var connection = CreateConnection();
            await connection.OpenAsync(cancellationToken).ConfigureAwait(false);

            var command = connection.CreateCommand();
            command.CommandText = "SELECT id, anime_id, episode_number, file_path, duration_seconds FROM episode WHERE id = $id";
            command.Parameters.AddWithValue("$id", episodeId.ToString());

            await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
            if (!await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            {
                return null;
            }

            var episode = new AnimeEpisode
            {
                Id = Guid.Parse(reader.GetString(0)),
                AnimeId = Guid.Parse(reader.GetString(1)),
                EpisodeNumber = reader.GetString(2),
                FilePath = reader.GetString(3),
                DurationSeconds = reader.IsDBNull(4) ? null : reader.GetDouble(4)
            };

            episode.Subtitles = await GetEpisodeSubtitlesAsync(episode.Id, connection, cancellationToken).ConfigureAwait(false);

            return episode;
        }

        /// <inheritdoc />
        public async Task<AnimeSubtitle?> GetSubtitleAsync(Guid subtitleId, CancellationToken cancellationToken)
        {
            await EnsureDatabaseAsync(cancellationToken).ConfigureAwait(false);

            await using var connection = CreateConnection();
            await connection.OpenAsync(cancellationToken).ConfigureAwait(false);

            var command = connection.CreateCommand();
            command.CommandText = "SELECT id, episode_id, file_path, format, display_name FROM subtitle WHERE id = $id";
            command.Parameters.AddWithValue("$id", subtitleId.ToString());

            await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
            if (!await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            {
                return null;
            }

            return new AnimeSubtitle
            {
                Id = Guid.Parse(reader.GetString(0)),
                EpisodeId = Guid.Parse(reader.GetString(1)),
                FilePath = reader.GetString(2),
                Format = reader.IsDBNull(3) ? null : reader.GetString(3),
                DisplayName = reader.GetString(4)
            };
        }

        /// <inheritdoc />
        public async Task<string?> GetCoverPathAsync(Guid id, CancellationToken cancellationToken)
        {
            await EnsureDatabaseAsync(cancellationToken).ConfigureAwait(false);

            await using var connection = CreateConnection();
            await connection.OpenAsync(cancellationToken).ConfigureAwait(false);

            var command = connection.CreateCommand();
            command.CommandText = "SELECT cover_path FROM anime WHERE id = $id";
            command.Parameters.AddWithValue("$id", id.ToString());

            var result = await command.ExecuteScalarAsync(cancellationToken).ConfigureAwait(false);
            return result switch
            {
                string path when !string.IsNullOrWhiteSpace(path) => path,
                _ => null
            };
        }

        private async Task EnsureDatabaseAsync(CancellationToken cancellationToken)
        {
            if (_databaseInitialized)
            {
                return;
            }

            await _schemaGate.WaitAsync(cancellationToken).ConfigureAwait(false);
            try
            {
                if (_databaseInitialized)
                {
                    return;
                }

                Directory.CreateDirectory(Path.GetDirectoryName(_catalogPath)!);
                await using var connection = CreateConnection();
                await connection.OpenAsync(cancellationToken).ConfigureAwait(false);

                var command = connection.CreateCommand();
                command.CommandText = @"
                    PRAGMA journal_mode=WAL;
                    CREATE TABLE IF NOT EXISTS anime (
                        id TEXT PRIMARY KEY,
                        title TEXT NOT NULL,
                        folder_path TEXT NOT NULL,
                        cover_path TEXT,
                        episode_count INTEGER NOT NULL
                    );
                    CREATE TABLE IF NOT EXISTS episode (
                        id TEXT PRIMARY KEY,
                        anime_id TEXT NOT NULL,
                        episode_number TEXT NOT NULL,
                        file_path TEXT NOT NULL,
                        duration_seconds REAL,
                        sort_index INTEGER NOT NULL,
                        FOREIGN KEY(anime_id) REFERENCES anime(id) ON DELETE CASCADE
                    );
                    CREATE TABLE IF NOT EXISTS subtitle (
                        id TEXT PRIMARY KEY,
                        anime_id TEXT NOT NULL,
                        episode_id TEXT NOT NULL,
                        file_path TEXT NOT NULL,
                        format TEXT,
                        display_name TEXT NOT NULL,
                        FOREIGN KEY(anime_id) REFERENCES anime(id) ON DELETE CASCADE,
                        FOREIGN KEY(episode_id) REFERENCES episode(id) ON DELETE CASCADE
                    );";

                await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
                _databaseInitialized = true;
            }
            finally
            {
                _schemaGate.Release();
            }
        }

        private async Task ClearCatalogAsync(CancellationToken cancellationToken)
        {
            await using var connection = CreateConnection();
            await connection.OpenAsync(cancellationToken).ConfigureAwait(false);
            var command = connection.CreateCommand();
            command.CommandText = "DELETE FROM subtitle; DELETE FROM episode; DELETE FROM anime;";
            await command.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
        }

        private async Task PersistCatalogAsync(IReadOnlyList<AnimeSeriesDetail> series, CancellationToken cancellationToken)
        {
            await using var connection = CreateConnection();
            await connection.OpenAsync(cancellationToken).ConfigureAwait(false);

            await using var transaction = await connection.BeginTransactionAsync(cancellationToken).ConfigureAwait(false);

            var clearCommand = connection.CreateCommand();
            clearCommand.Transaction = transaction;
            clearCommand.CommandText = "DELETE FROM subtitle; DELETE FROM episode; DELETE FROM anime;";
            await clearCommand.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);

            foreach (var anime in series)
            {
                var insertAnime = connection.CreateCommand();
                insertAnime.Transaction = transaction;
                insertAnime.CommandText = @"INSERT INTO anime (id, title, folder_path, cover_path, episode_count) VALUES ($id, $title, $folder, $cover, $count)";
                insertAnime.Parameters.AddWithValue("$id", anime.Id.ToString());
                insertAnime.Parameters.AddWithValue("$title", anime.Title);
                insertAnime.Parameters.AddWithValue("$folder", anime.FolderPath);
                insertAnime.Parameters.AddWithValue("$cover", (object?)anime.CoverImagePath ?? DBNull.Value);
                insertAnime.Parameters.AddWithValue("$count", anime.Episodes.Count);
                await insertAnime.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);

                for (var index = 0; index < anime.Episodes.Count; index++)
                {
                    var episode = anime.Episodes[index];
                    var insertEpisode = connection.CreateCommand();
                    insertEpisode.Transaction = transaction;
                    insertEpisode.CommandText = @"INSERT INTO episode (id, anime_id, episode_number, file_path, duration_seconds, sort_index) VALUES ($id, $animeId, $number, $file, $duration, $sort)";
                    insertEpisode.Parameters.AddWithValue("$id", episode.Id.ToString());
                    insertEpisode.Parameters.AddWithValue("$animeId", episode.AnimeId.ToString());
                    insertEpisode.Parameters.AddWithValue("$number", episode.EpisodeNumber);
                    insertEpisode.Parameters.AddWithValue("$file", episode.FilePath);
                    insertEpisode.Parameters.AddWithValue("$duration", (object?)episode.DurationSeconds ?? DBNull.Value);
                    insertEpisode.Parameters.AddWithValue("$sort", index);
                    await insertEpisode.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);

                    foreach (var subtitle in episode.Subtitles)
                    {
                        var insertSubtitle = connection.CreateCommand();
                        insertSubtitle.Transaction = transaction;
                        insertSubtitle.CommandText = @"INSERT INTO subtitle (id, anime_id, episode_id, file_path, format, display_name) VALUES ($id, $animeId, $episodeId, $file, $format, $display)";
                        insertSubtitle.Parameters.AddWithValue("$id", subtitle.Id.ToString());
                        insertSubtitle.Parameters.AddWithValue("$animeId", anime.Id.ToString());
                        insertSubtitle.Parameters.AddWithValue("$episodeId", episode.Id.ToString());
                        insertSubtitle.Parameters.AddWithValue("$file", subtitle.FilePath);
                        insertSubtitle.Parameters.AddWithValue("$format", (object?)subtitle.Format ?? DBNull.Value);
                        insertSubtitle.Parameters.AddWithValue("$display", subtitle.DisplayName);
                        await insertSubtitle.ExecuteNonQueryAsync(cancellationToken).ConfigureAwait(false);
                    }
                }
            }

            await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);
        }

        private async Task<List<AnimeSubtitle>> GetEpisodeSubtitlesAsync(Guid episodeId, SqliteConnection connection, CancellationToken cancellationToken)
        {
            var command = connection.CreateCommand();
            command.CommandText = "SELECT id, episode_id, file_path, format, display_name FROM subtitle WHERE episode_id = $id";
            command.Parameters.AddWithValue("$id", episodeId.ToString());

            var result = new List<AnimeSubtitle>();
            await using var reader = await command.ExecuteReaderAsync(cancellationToken).ConfigureAwait(false);
            while (await reader.ReadAsync(cancellationToken).ConfigureAwait(false))
            {
                result.Add(new AnimeSubtitle
                {
                    Id = Guid.Parse(reader.GetString(0)),
                    EpisodeId = Guid.Parse(reader.GetString(1)),
                    FilePath = reader.GetString(2),
                    Format = reader.IsDBNull(3) ? null : reader.GetString(3),
                    DisplayName = reader.GetString(4)
                });
            }

            return result;
        }

        private async Task<AnimeSeriesDetail> BuildSeriesDetailAsync(string directory, CancellationToken cancellationToken)
        {
            var title = Path.GetFileName(directory.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar));
            var id = CreateDeterministicGuid(directory);
            var coverPath = ResolveCoverArt(directory);

            var episodes = new List<AnimeEpisode>();
            var files = _fileSystem.GetFiles(directory)
                .Where(file => VideoExtensions.Contains(Path.GetExtension(file.FullName), StringComparer.OrdinalIgnoreCase))
                .OrderBy(file => file.Name, StringComparer.OrdinalIgnoreCase)
                .ToList();

            var sortIndex = 0;
            foreach (var file in files)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var episodeId = CreateDeterministicGuid(file.FullName);
                var episodeNumber = ExtractEpisodeIdentifier(file.Name);
                var duration = await ProbeDurationAsync(file.FullName, cancellationToken).ConfigureAwait(false);

                var subtitles = await DiscoverSubtitlesAsync(file.FullName, cancellationToken).ConfigureAwait(false);

                episodes.Add(new AnimeEpisode
                {
                    Id = episodeId,
                    AnimeId = id,
                    EpisodeNumber = episodeNumber,
                    FilePath = file.FullName,
                    DurationSeconds = duration,
                    Subtitles = subtitles
                });

                sortIndex++;

                if (coverPath is null && sortIndex == 1)
                {
                    coverPath = await GenerateThumbnailAsync(file.FullName, id, cancellationToken).ConfigureAwait(false);
                }
            }

            coverPath ??= await GenerateFallbackCoverAsync(directory, id, cancellationToken).ConfigureAwait(false);

            return new AnimeSeriesDetail
            {
                Id = id,
                Title = title,
                FolderPath = directory,
                CoverImagePath = coverPath,
                EpisodeCount = episodes.Count,
                Episodes = episodes
            };
        }

        private async Task<IReadOnlyList<AnimeSubtitle>> DiscoverSubtitlesAsync(string videoPath, CancellationToken cancellationToken)
        {
            var directory = Path.GetDirectoryName(videoPath)!;
            var fileNameWithoutExtension = Path.GetFileNameWithoutExtension(videoPath);
            var subtitles = new List<AnimeSubtitle>();

            foreach (var file in _fileSystem.GetFiles(directory))
            {
                cancellationToken.ThrowIfCancellationRequested();

                var extension = Path.GetExtension(file.FullName);
                if (!SubtitleExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
                {
                    continue;
                }

                var nameWithoutExtension = Path.GetFileNameWithoutExtension(file.FullName);
                if (!nameWithoutExtension.StartsWith(fileNameWithoutExtension, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                subtitles.Add(new AnimeSubtitle
                {
                    Id = CreateDeterministicGuid(file.FullName),
                    EpisodeId = CreateDeterministicGuid(videoPath),
                    FilePath = file.FullName,
                    Format = extension.TrimStart('.'),
                    DisplayName = Path.GetFileName(file.FullName)
                });
            }

            return subtitles;
        }

        private string? ResolveCoverArt(string directory)
        {
            foreach (var candidate in CoverCandidates)
            {
                var path = Path.Combine(directory, candidate);
                if (_fileSystem.FileExists(path))
                {
                    return path;
                }
            }

            return null;
        }

        private async Task<string?> GenerateFallbackCoverAsync(string directory, Guid seriesId, CancellationToken cancellationToken)
        {
            var firstVideo = _fileSystem.GetFiles(directory)
                .FirstOrDefault(file => VideoExtensions.Contains(Path.GetExtension(file.FullName), StringComparer.OrdinalIgnoreCase));

            if (firstVideo is null)
            {
                return null;
            }

            return await GenerateThumbnailAsync(firstVideo.FullName, seriesId, cancellationToken).ConfigureAwait(false);
        }

        private async Task<string?> GenerateThumbnailAsync(string videoPath, Guid seriesId, CancellationToken cancellationToken)
        {
            if (!await EnsureFfmpegAsync("ffmpeg", cancellationToken).ConfigureAwait(false))
            {
                return null;
            }

            var outputPath = Path.Combine(_coverOutputPath, seriesId + ".jpg");
            try
            {
                var arguments = new[]
                {
                    "-y",
                    "-ss",
                    "5",
                    "-i",
                    videoPath,
                    "-frames:v",
                    "1",
                    outputPath
                };

                await RunProcessAsync("ffmpeg", arguments, cancellationToken).ConfigureAwait(false);
                return outputPath;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to generate thumbnail for {Video}", videoPath);
                return null;
            }
        }

        private async Task<double?> ProbeDurationAsync(string videoPath, CancellationToken cancellationToken)
        {
            if (!await EnsureFfmpegAsync("ffprobe", cancellationToken).ConfigureAwait(false))
            {
                return null;
            }

            try
            {
                var arguments = new[]
                {
                    "-v",
                    "error",
                    "-show_entries",
                    "format=duration",
                    "-of",
                    "default=noprint_wrappers=1:nokey=1",
                    videoPath
                };

                var output = await RunProcessAsync("ffprobe", arguments, cancellationToken).ConfigureAwait(false);
                if (double.TryParse(output.Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out var seconds))
                {
                    return seconds;
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to probe duration for {Video}", videoPath);
            }

            return null;
        }

        private async Task<string> RunProcessAsync(string executable, IEnumerable<string> arguments, CancellationToken cancellationToken)
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = executable,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            foreach (var argument in arguments)
            {
                startInfo.ArgumentList.Add(argument);
            }

            using var process = new Process { StartInfo = startInfo };
            process.Start();
            var outputTask = process.StandardOutput.ReadToEndAsync();
            var errorTask = process.StandardError.ReadToEndAsync();
            await process.WaitForExitAsync(cancellationToken).ConfigureAwait(false);

            if (process.ExitCode != 0)
            {
                var error = await errorTask.ConfigureAwait(false);
                throw new InvalidOperationException($"Process '{executable}' failed with exit code {process.ExitCode}: {error}");
            }

            return await outputTask.ConfigureAwait(false);
        }

        private async Task<bool> EnsureFfmpegAsync(string toolName, CancellationToken cancellationToken)
        {
            if (toolName.Equals("ffprobe", StringComparison.OrdinalIgnoreCase) && _ffprobeAvailable.HasValue)
            {
                return _ffprobeAvailable.Value;
            }

            if (toolName.Equals("ffmpeg", StringComparison.OrdinalIgnoreCase) && _ffmpegAvailable.HasValue)
            {
                return _ffmpegAvailable.Value;
            }

            try
            {
                await RunProcessAsync(toolName, new[] { "-version" }, cancellationToken).ConfigureAwait(false);
                if (toolName.Equals("ffprobe", StringComparison.OrdinalIgnoreCase))
                {
                    _ffprobeAvailable = true;
                }
                else if (toolName.Equals("ffmpeg", StringComparison.OrdinalIgnoreCase))
                {
                    _ffmpegAvailable = true;
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "{Tool} is not available on PATH.", toolName);
                if (toolName.Equals("ffprobe", StringComparison.OrdinalIgnoreCase))
                {
                    _ffprobeAvailable = false;
                }
                else if (toolName.Equals("ffmpeg", StringComparison.OrdinalIgnoreCase))
                {
                    _ffmpegAvailable = false;
                }

                return false;
            }
        }

        private static Guid CreateDeterministicGuid(string input)
        {
            using var md5 = MD5.Create();
            var bytes = md5.ComputeHash(System.Text.Encoding.UTF8.GetBytes(input));
            return new Guid(bytes);
        }

        private static string ExtractEpisodeIdentifier(string fileName)
        {
            var withoutExtension = Path.GetFileNameWithoutExtension(fileName);

            var seasonEpisodeMatch = Regex.Match(withoutExtension, "S(?<season>\\d{1,2})[^\\d]*E(?<episode>\\d{1,3})", RegexOptions.IgnoreCase);
            if (seasonEpisodeMatch.Success)
            {
                return $"S{int.Parse(seasonEpisodeMatch.Groups["season"].Value, CultureInfo.InvariantCulture):D2}E{int.Parse(seasonEpisodeMatch.Groups["episode"].Value, CultureInfo.InvariantCulture):D2}";
            }

            var episodeMatch = Regex.Match(withoutExtension, "Episode[^0-9]*(?<episode>\\d{1,3})", RegexOptions.IgnoreCase);
            if (episodeMatch.Success)
            {
                return episodeMatch.Groups["episode"].Value;
            }

            var numberMatch = Regex.Match(withoutExtension, "(?<!\\d)(\\d{1,3})(?!\\d)");
            if (numberMatch.Success)
            {
                return numberMatch.Groups[1].Value;
            }

            return withoutExtension;
        }

        private SqliteConnection CreateConnection()
        {
            return new SqliteConnection(new SqliteConnectionStringBuilder
            {
                DataSource = _catalogPath,
                ForeignKeys = true
            }.ToString());
        }
    }
}
