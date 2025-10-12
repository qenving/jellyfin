using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace MediaBrowser.Controller.Anime.Models
{
    /// <summary>
    /// Describes the outcome of an anime catalog scan.
    /// </summary>
    public class AnimeScanResult
    {
        [JsonPropertyName("seriesCount")]
        public int SeriesCount { get; init; }

        [JsonPropertyName("episodeCount")]
        public int EpisodeCount { get; init; }

        [JsonPropertyName("generatedThumbnails")]
        public int GeneratedThumbnails { get; init; }

        [JsonPropertyName("messages")]
        public IReadOnlyList<string> Messages { get; init; } = new List<string>();
    }
}
