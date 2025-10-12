using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace MediaBrowser.Controller.Anime.Models
{
    /// <summary>
    /// Represents an anime episode discovered in the local library.
    /// </summary>
    public class AnimeEpisode
    {
        [JsonPropertyName("id")]
        public Guid Id { get; init; }

        [JsonPropertyName("animeId")]
        public Guid AnimeId { get; init; }

        [JsonPropertyName("episodeNumber")]
        public string EpisodeNumber { get; init; } = string.Empty;

        [JsonPropertyName("filePath")]
        public string FilePath { get; init; } = string.Empty;

        [JsonPropertyName("durationSeconds")]
        public double? DurationSeconds { get; init; }

        [JsonPropertyName("subtitles")]
        public IReadOnlyList<AnimeSubtitle> Subtitles { get; set; } = new List<AnimeSubtitle>();
    }
}
