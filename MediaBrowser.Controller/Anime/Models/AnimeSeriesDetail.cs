using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace MediaBrowser.Controller.Anime.Models
{
    /// <summary>
    /// Detailed series record including episode metadata.
    /// </summary>
    public class AnimeSeriesDetail : AnimeSeries
    {
        [JsonPropertyName("episodes")]
        public IReadOnlyList<AnimeEpisode> Episodes { get; set; } = new List<AnimeEpisode>();
    }
}
