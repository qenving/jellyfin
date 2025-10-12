using System;
using System.Text.Json.Serialization;

namespace MediaBrowser.Controller.Anime.Models
{
    /// <summary>
    /// Represents a subtitle file linked to an anime episode.
    /// </summary>
    public class AnimeSubtitle
    {
        [JsonPropertyName("id")]
        public Guid Id { get; init; }

        [JsonPropertyName("episodeId")]
        public Guid EpisodeId { get; init; }

        [JsonPropertyName("filePath")]
        public string FilePath { get; init; } = string.Empty;

        [JsonPropertyName("format")]
        public string? Format { get; init; }

        [JsonPropertyName("displayName")]
        public string DisplayName { get; init; } = string.Empty;
    }
}
