using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediaBrowser.Controller.Anime.Models;

namespace MediaBrowser.Controller.Anime
{
    /// <summary>
    /// Provides access to the locally scanned anime catalog.
    /// </summary>
    public interface IAnimeCatalogService
    {
        /// <summary>
        /// Runs a library scan and refreshes the anime catalog database.
        /// </summary>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Summary of the scan.</returns>
        Task<AnimeScanResult> ScanAsync(CancellationToken cancellationToken);

        /// <summary>
        /// Gets all anime series discovered in the catalog.
        /// </summary>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>List of anime series.</returns>
        Task<IReadOnlyList<AnimeSeries>> GetAnimeAsync(CancellationToken cancellationToken);

        /// <summary>
        /// Gets the detail record for a specific anime series.
        /// </summary>
        /// <param name="id">Series identifier.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Detailed record or null when missing.</returns>
        Task<AnimeSeriesDetail?> GetAnimeDetailAsync(Guid id, CancellationToken cancellationToken);

        /// <summary>
        /// Gets the episode metadata for an episode identifier.
        /// </summary>
        /// <param name="episodeId">Episode identifier.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Episode metadata or null.</returns>
        Task<AnimeEpisode?> GetEpisodeAsync(Guid episodeId, CancellationToken cancellationToken);

        /// <summary>
        /// Gets the subtitle metadata for a subtitle identifier.
        /// </summary>
        /// <param name="subtitleId">Subtitle identifier.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Subtitle metadata or null.</returns>
        Task<AnimeSubtitle?> GetSubtitleAsync(Guid subtitleId, CancellationToken cancellationToken);

        /// <summary>
        /// Resolves the cover artwork path for a series identifier.
        /// </summary>
        /// <param name="id">Series identifier.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Absolute path to the cover image or null.</returns>
        Task<string?> GetCoverPathAsync(Guid id, CancellationToken cancellationToken);
    }
}
