# API Documentation

Complete API documentation untuk Jellyfin Anime Platform Backend.

## Base URL

```
Development: http://localhost:3001/api
Production: https://your-domain.com/api
```

## Authentication

API menggunakan JWT (JSON Web Token) yang disimpan dalam **HTTP-only cookie** bernama `auth-token`.

### Authentication Flow

1. User register atau login
2. Server return JWT in HTTP-only cookie
3. Client automatically sends cookie dengan setiap request
4. Server validate JWT dari cookie

### Protected Endpoints

Semua endpoint kecuali `/auth/register` dan `/auth/login` memerlukan authentication.

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "timestamp": "2025-01-10T12:00:00.000Z",
  "path": "/api/auth/login",
  "method": "POST",
  "message": "Invalid credentials"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

---

## Authentication Endpoints

### POST /auth/register

Register user baru.

**Request Body:**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test1234"
}
```

**Validation Rules:**
- `username`: 3-20 characters, alphanumeric + underscore/hyphen
- `email`: Valid email format
- `password`: Min 8 characters, must contain uppercase, lowercase, and number

**Success Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "displayName": "testuser",
    "avatarUrl": null,
    "isAdmin": false
  }
}
```

**Cookies Set:**
- `auth-token`: JWT token (HTTP-only, 7 days)

**Error Responses:**
- `409`: Username or email already exists
- `400`: Validation error

---

### POST /auth/login

Login user.

**Request Body:**
```json
{
  "usernameOrEmail": "testuser",
  "password": "Test1234"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "displayName": "testuser",
    "avatarUrl": null,
    "isAdmin": false
  }
}
```

**Cookies Set:**
- `auth-token`: JWT token (HTTP-only, 7 days)

**Error Responses:**
- `401`: Invalid credentials
- `401`: Account is disabled

---

### POST /auth/logout

Logout user (clear cookie).

**Auth Required:** Yes

**Success Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### GET /auth/me

Get current user info.

**Auth Required:** Yes

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "username": "testuser",
    "email": "test@example.com",
    "displayName": "testuser",
    "avatarUrl": null,
    "isAdmin": false
  }
}
```

---

### POST /auth/refresh

Refresh JWT token.

**Auth Required:** Yes

**Success Response (200):**
```json
{
  "message": "Token refreshed"
}
```

**Cookies Set:**
- `auth-token`: New JWT token

---

## Anime Endpoints

### GET /anime

Get list of anime dengan pagination dan filter.

**Auth Required:** Yes

**Query Parameters:**
- `search` (string, optional): Search by title
- `sortBy` (string, optional): `Name`, `PremiereDate`, `CommunityRating`, `DateCreated`
- `sortOrder` (string, optional): `Ascending` or `Descending`
- `limit` (number, optional): Items per page (default: 50)
- `page` (number, optional): Page number (default: 0)
- `genres` (array, optional): Filter by genres
- `years` (array, optional): Filter by years

**Example Request:**
```
GET /anime?search=naruto&sortBy=Name&sortOrder=Ascending&limit=20&page=0
```

**Success Response (200):**
```json
{
  "items": [
    {
      "id": "jellyfin-item-id",
      "name": "Naruto",
      "overview": "Anime description...",
      "rating": 8.5,
      "releaseYear": 2002,
      "premiereDate": "2002-10-03",
      "genres": ["Action", "Adventure", "Shounen"],
      "posterUrl": "http://jellyfin/Items/id/Images/Primary",
      "backdropUrl": "http://jellyfin/Items/id/Images/Backdrop",
      "logoUrl": null,
      "isFavorite": false,
      "playbackProgress": 0,
      "isWatched": false
    }
  ],
  "total": 100,
  "page": 0,
  "limit": 20
}
```

---

### GET /anime/:id

Get detailed information tentang anime.

**Auth Required:** Yes

**Path Parameters:**
- `id`: Jellyfin item ID

**Success Response (200):**
```json
{
  "id": "jellyfin-item-id",
  "name": "Naruto",
  "overview": "Full description...",
  "rating": 8.5,
  "releaseYear": 2002,
  "premiereDate": "2002-10-03",
  "genres": ["Action", "Adventure", "Shounen"],
  "studios": ["Studio Pierrot"],
  "posterUrl": "...",
  "backdropUrl": "...",
  "logoUrl": "...",
  "isFavorite": false,
  "isWatched": false,
  "runtime": 1440,
  "seasons": [
    {
      "id": "season-id",
      "name": "Season 1",
      "overview": "...",
      "seasonNumber": 1,
      "posterUrl": "...",
      "episodeCount": 52
    }
  ],
  "episodes": [
    {
      "id": "episode-id",
      "name": "Episode 1",
      "overview": "...",
      "episodeNumber": 1,
      "seasonNumber": 1,
      "seriesName": "Naruto",
      "posterUrl": "...",
      "runtime": 1440,
      "isWatched": false,
      "playbackProgress": 0
    }
  ]
}
```

---

### GET /anime/:animeId/seasons/:seasonId/episodes

Get episodes dari season tertentu.

**Auth Required:** Yes

**Path Parameters:**
- `animeId`: Anime ID
- `seasonId`: Season ID

**Success Response (200):**
```json
[
  {
    "id": "episode-id",
    "name": "Episode 1",
    "overview": "...",
    "episodeNumber": 1,
    "seasonNumber": 1,
    "seriesName": "Naruto",
    "posterUrl": "...",
    "runtime": 1440,
    "isWatched": false,
    "playbackProgress": 0
  }
]
```

---

### GET /anime/stream/:episodeId

Get streaming URL untuk episode.

**Auth Required:** Yes

**Path Parameters:**
- `episodeId`: Episode ID

**Success Response (200):**
```json
{
  "streamUrl": "http://jellyfin/Videos/episode-id/stream?...",
  "playbackInfo": {
    "MediaSources": [...]
  }
}
```

---

### POST /anime/progress

Update watch progress.

**Auth Required:** Yes

**Request Body:**
```json
{
  "episodeId": "episode-id",
  "progressSeconds": 300,
  "durationSeconds": 1440
}
```

**Success Response (200):**
```json
{
  "message": "Progress updated"
}
```

---

### PUT /anime/:animeId/favorite

Toggle favorite status.

**Auth Required:** Yes

**Path Parameters:**
- `animeId`: Anime ID

**Request Body:**
```json
{
  "isFavorite": true
}
```

**Success Response (200):**
```json
{
  "message": "Favorite status updated"
}
```

---

### GET /anime/continue-watching

Get continue watching list.

**Auth Required:** Yes

**Query Parameters:**
- `limit` (number, optional): Max items (default: 10)

**Success Response (200):**
```json
[
  {
    "id": "history-id",
    "episodeId": "episode-id",
    "animeId": "anime-id",
    "animeTitle": "Naruto",
    "episodeTitle": "Episode 1",
    "seasonNumber": 1,
    "episodeNumber": 1,
    "progressSeconds": 300,
    "durationSeconds": 1440,
    "completed": false,
    "watchedAt": "2025-01-10T12:00:00.000Z",
    "updatedAt": "2025-01-10T12:05:00.000Z"
  }
]
```

---

### GET /anime/history

Get watch history.

**Auth Required:** Yes

**Query Parameters:**
- `limit` (number, optional): Max items (default: 20)

**Success Response (200):**
```json
[
  {
    "id": "history-id",
    "episodeId": "episode-id",
    "animeId": "anime-id",
    "animeTitle": "Naruto",
    "episodeTitle": "Episode 1",
    "seasonNumber": 1,
    "episodeNumber": 1,
    "progressSeconds": 1440,
    "durationSeconds": 1440,
    "completed": true,
    "watchedAt": "2025-01-10T12:00:00.000Z"
  }
]
```

---

## Watchlist Endpoints

### GET /watchlist

Get user's watchlist.

**Auth Required:** Yes

**Success Response (200):**
```json
[
  {
    "id": "watchlist-id",
    "animeId": "anime-id",
    "animeTitle": "Naruto",
    "posterUrl": "...",
    "addedAt": "2025-01-10T12:00:00.000Z"
  }
]
```

---

### GET /watchlist/check/:animeId

Check if anime is in watchlist.

**Auth Required:** Yes

**Path Parameters:**
- `animeId`: Anime ID

**Success Response (200):**
```json
{
  "isInWatchlist": true
}
```

---

### POST /watchlist/:animeId

Add anime to watchlist.

**Auth Required:** Yes

**Path Parameters:**
- `animeId`: Anime ID

**Success Response (201):**
```json
{
  "id": "watchlist-id",
  "animeId": "anime-id",
  "animeTitle": "Naruto",
  "posterUrl": "...",
  "addedAt": "2025-01-10T12:00:00.000Z"
}
```

---

### DELETE /watchlist/:animeId

Remove anime from watchlist.

**Auth Required:** Yes

**Path Parameters:**
- `animeId`: Anime ID

**Success Response (200):**
```json
{
  "message": "Removed from watchlist"
}
```

---

## User Endpoints

### GET /user/profile

Get user profile.

**Auth Required:** Yes

**Success Response (200):**
```json
{
  "id": "uuid",
  "username": "testuser",
  "email": "test@example.com",
  "displayName": "testuser",
  "avatarUrl": null,
  "isAdmin": false,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "lastLoginAt": "2025-01-10T12:00:00.000Z"
}
```

---

### PUT /user/profile

Update user profile.

**Auth Required:** Yes

**Request Body:**
```json
{
  "displayName": "New Display Name",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "username": "testuser",
  "email": "test@example.com",
  "displayName": "New Display Name",
  "avatarUrl": "https://example.com/avatar.jpg",
  "isAdmin": false
}
```

---

### GET /user/preferences

Get user preferences.

**Auth Required:** Yes

**Success Response (200):**
```json
{
  "id": "pref-id",
  "userId": "user-id",
  "autoPlay": true,
  "autoSkipIntro": false,
  "defaultQuality": "auto",
  "subtitleLang": "en",
  "theme": "dark",
  "language": "en",
  "emailNotifications": true
}
```

---

### PUT /user/preferences

Update user preferences.

**Auth Required:** Yes

**Request Body:**
```json
{
  "autoPlay": true,
  "autoSkipIntro": true,
  "defaultQuality": "1080p",
  "subtitleLang": "en"
}
```

**Success Response (200):**
```json
{
  "id": "pref-id",
  "userId": "user-id",
  "autoPlay": true,
  "autoSkipIntro": true,
  "defaultQuality": "1080p",
  "subtitleLang": "en",
  "theme": "dark",
  "language": "en",
  "emailNotifications": true
}
```

---

### GET /user/stats

Get user statistics.

**Auth Required:** Yes

**Success Response (200):**
```json
{
  "totalWatched": 50,
  "totalWatchlist": 10,
  "totalCompleted": 25
}
```

---

## Rate Limiting

API memiliki rate limiting untuk mencegah abuse:

**Global API:**
- 10 requests/second per IP
- Burst: 20 requests

**Auth Endpoints:**
- 5 requests/minute per IP
- Burst: 3 requests

Rate limit headers:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1610000000
```

## Testing with Curl

### Register
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test1234"
  }' \
  -c cookies.txt
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "testuser",
    "password": "Test1234"
  }' \
  -c cookies.txt
```

### Get Anime List (with auth)
```bash
curl http://localhost:3001/api/anime \
  -b cookies.txt
```

## Testing with Postman

1. Import API collection
2. Set environment variable `baseUrl` = `http://localhost:3001/api`
3. Login request akan auto-save cookie
4. Subsequent requests akan auto-send cookie

---

**For more examples, see the `/examples` folder in the repository.**
