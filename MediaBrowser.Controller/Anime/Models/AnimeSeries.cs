using System;
using System.Text.Json.Serialization;

namespace MediaBrowser.Controller.Anime.Models
{
    /// <summary>
    /// Represents a locally discovered anime series.
    /// </summary>
    public class AnimeSeries
    {
        [JsonPropertyName("id")]
        public Guid Id { get; init; }

        [JsonPropertyName("title")]
        public string Title { get; init; } = string.Empty;

        [JsonPropertyName("folderPath")]
        public string FolderPath { get; init; } = string.Empty;

        [JsonPropertyName("coverImagePath")]
        public string? CoverImagePath { get; init; }

        [JsonPropertyName("episodeCount")]
        public int EpisodeCount { get; init; }
    }
}
