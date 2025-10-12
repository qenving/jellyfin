using System;
using System.Net.Mime;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using MediaBrowser.Controller.Anime;
using MediaBrowser.Controller.Anime.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Jellyfin.Api.Controllers
{
    /// <summary>
    /// Provides endpoints for the locally scanned anime catalog.
    /// </summary>
    [Authorize]
    [Route("AnimeCatalog")]
    public class AnimeCatalogController : BaseJellyfinApiController
    {
        private readonly IAnimeCatalogService _catalogService;
        private readonly ILogger<AnimeCatalogController> _logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="AnimeCatalogController"/> class.
        /// </summary>
        public AnimeCatalogController(IAnimeCatalogService catalogService, ILogger<AnimeCatalogController> logger)
        {
            _catalogService = catalogService;
            _logger = logger;
        }

        /// <summary>
        /// Runs a fresh scan of the anime library and updates the catalog.
        /// </summary>
        [HttpPost("scan")]
        [ProducesResponseType(typeof(AnimeScanResult), StatusCodes.Status200OK)]
        public async Task<ActionResult<AnimeScanResult>> ScanAsync(CancellationToken cancellationToken)
        {
            var result = await _catalogService.ScanAsync(cancellationToken).ConfigureAwait(false);
            return Ok(result);
        }

        /// <summary>
        /// Returns all anime series in the catalog.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(AnimeSeries[]), StatusCodes.Status200OK)]
        public async Task<ActionResult> GetSeriesAsync(CancellationToken cancellationToken)
        {
            var anime = await _catalogService.GetAnimeAsync(cancellationToken).ConfigureAwait(false);
            return Ok(anime);
        }

        /// <summary>
        /// Returns detailed metadata for a series including episodes.
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(AnimeSeriesDetail), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetSeriesDetailAsync(Guid id, CancellationToken cancellationToken)
        {
            var detail = await _catalogService.GetAnimeDetailAsync(id, cancellationToken).ConfigureAwait(false);
            if (detail is null)
            {
                return NotFound();
            }

            return Ok(detail);
        }

        /// <summary>
        /// Streams a specific episode file directly from disk.
        /// </summary>
        [HttpGet("episodes/{episodeId}/stream")]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> StreamEpisodeAsync(Guid episodeId, CancellationToken cancellationToken)
        {
            var episode = await _catalogService.GetEpisodeAsync(episodeId, cancellationToken).ConfigureAwait(false);
            if (episode is null)
            {
                return NotFound();
            }

            if (!System.IO.File.Exists(episode.FilePath))
            {
                _logger.LogWarning("Episode file missing at {Path}", episode.FilePath);
                return NotFound();
            }

            var mimeType = MediaBrowser.Model.Net.MimeTypes.GetMimeType(episode.FilePath, "application/octet-stream");
            return PhysicalFile(episode.FilePath, mimeType ?? "application/octet-stream", enableRangeProcessing: true);
        }

        /// <summary>
        /// Serves a subtitle file for playback.
        /// </summary>
        [HttpGet("subtitles/{subtitleId}")]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetSubtitleAsync(Guid subtitleId, CancellationToken cancellationToken)
        {
            var subtitle = await _catalogService.GetSubtitleAsync(subtitleId, cancellationToken).ConfigureAwait(false);
            if (subtitle is null)
            {
                return NotFound();
            }

            if (!System.IO.File.Exists(subtitle.FilePath))
            {
                _logger.LogWarning("Subtitle file missing at {Path}", subtitle.FilePath);
                return NotFound();
            }

            var mimeType = MediaBrowser.Model.Net.MimeTypes.GetMimeType(subtitle.FilePath, "text/plain");
            return PhysicalFile(subtitle.FilePath, mimeType ?? "text/plain", subtitle.DisplayName);
        }

        /// <summary>
        /// Returns the cover image for a series.
        /// </summary>
        [HttpGet("{id}/cover")]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetCoverAsync(Guid id, CancellationToken cancellationToken)
        {
            var coverPath = await _catalogService.GetCoverPathAsync(id, cancellationToken).ConfigureAwait(false);
            if (string.IsNullOrEmpty(coverPath) || !System.IO.File.Exists(coverPath))
            {
                return NotFound();
            }

            var mimeType = MediaBrowser.Model.Net.MimeTypes.GetMimeType(coverPath, "image/jpeg");
            return PhysicalFile(coverPath, mimeType ?? "image/jpeg");
        }

        /// <summary>
        /// Provides a lightweight UI to browse and play anime content.
        /// </summary>
        [AllowAnonymous]
        [HttpGet("ui")]
        [Produces(MediaTypeNames.Text.Html)]
        public async Task<IActionResult> GetUiAsync(CancellationToken cancellationToken)
        {
            var series = await _catalogService.GetAnimeAsync(cancellationToken).ConfigureAwait(false);
            var builder = new StringBuilder();
            builder.Append("<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Anime Catalog</title>");
            builder.Append("<style>:root{color-scheme:dark light;}body{margin:0;font-family:'Segoe UI',sans-serif;background:#090b10;color:#f1f5f9;}header{padding:1.5rem 2rem;background:linear-gradient(135deg,#1f2937,#0f172a);color:#fff;}h1{margin:0;font-size:1.8rem;}main{padding:1.5rem;}#grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem;}article{background:rgba(15,23,42,.8);border-radius:14px;overflow:hidden;box-shadow:0 12px 24px rgba(15,23,42,.45);transition:transform .2s,box-shadow .2s;}article:hover{transform:translateY(-4px);box-shadow:0 16px 32px rgba(15,23,42,.6);}article button{all:unset;cursor:pointer;width:100%;height:100%;display:flex;flex-direction:column;align-items:stretch;}article img{width:100%;height:220px;object-fit:cover;background:#1f2937;}article h2{margin:0;padding:0.75rem 0.85rem;font-size:1rem;font-weight:600;color:#e2e8f0;}#detail{margin-top:2rem;background:rgba(15,23,42,.9);border-radius:18px;padding:1.5rem;box-shadow:0 20px 44px rgba(15,23,42,.5);}#detail h2{margin:0 0 0.5rem;}#episodes{display:grid;gap:0.75rem;}#episodes button{all:unset;background:#111827;border-radius:12px;padding:0.9rem 1rem;display:flex;justify-content:space-between;align-items:center;cursor:pointer;transition:background .2s;}#episodes button:hover{background:#1f2937;}#player{margin-top:1.5rem;}video{width:100%;max-height:70vh;border-radius:16px;background:#000;}@media(max-width:768px){article img{height:180px;}header{padding:1rem 1.5rem;}main{padding:1rem;}#detail{padding:1rem;}}</style>");
            builder.Append("</head><body><header><h1>Anime Library</h1><p>Content is sourced directly from the local /media/anime folder.</p></header><main><section id=\"grid\">");

            foreach (var item in series)
            {
                var coverUrl = $"/AnimeCatalog/{item.Id}/cover";
                builder.Append($"<article><button type=\"button\" data-anime-id=\"{item.Id}\"><img src=\"{coverUrl}\" alt=\"{System.Net.WebUtility.HtmlEncode(item.Title)}\"><h2>{System.Net.WebUtility.HtmlEncode(item.Title)}</h2></button></article>");
            }

            builder.Append("</section><section id=\"detail\" hidden><h2 id=\"detail-title\"></h2><p id=\"detail-path\" style=\"opacity:.7;font-size:.9rem\"></p><div id=\"episodes\"></div><div id=\"player\" hidden><video id=\"video-player\" controls></video></div></section></main>");
            builder.Append("<script>const detailSection=document.getElementById('detail');const episodesList=document.getElementById('episodes');const detailTitle=document.getElementById('detail-title');const detailPath=document.getElementById('detail-path');const video=document.getElementById('video-player');const player=document.getElementById('player');async function loadDetail(id){const res=await fetch(`/AnimeCatalog/${id}`);if(!res.ok){alert('Failed to load series detail');return;}const data=await res.json();detailTitle.textContent=data.title;detailPath.textContent=data.folderPath;episodesList.innerHTML='';player.hidden=true;data.episodes.forEach(ep=>{const btn=document.createElement('button');btn.innerHTML=`<span>${ep.episodeNumber}</span><span style=\"opacity:.7;font-size:.85rem\">${Math.round((ep.durationSeconds??0)/60)} min</span>`;btn.addEventListener('click',()=>playEpisode(ep));episodesList.appendChild(btn);});detailSection.hidden=false;}async function playEpisode(episode){video.src=`/AnimeCatalog/episodes/${episode.id}/stream`;video.innerHTML='';(episode.subtitles||[]).forEach(sub=>{const track=document.createElement('track');track.kind='subtitles';track.label=sub.displayName;track.srclang=sub.format||'und';track.src=`/AnimeCatalog/subtitles/${sub.id}`;video.appendChild(track);});video.load();player.hidden=false;video.play();}document.querySelectorAll('#grid button').forEach(btn=>btn.addEventListener('click',()=>loadDetail(btn.dataset.animeId)));</script>");
            builder.Append("</body></html>");

            return Content(builder.ToString(), MediaTypeNames.Text.Html);
        }
    }
}
