import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  JellyfinAuthResponse,
  JellyfinUser,
  JellyfinItem,
  JellyfinItemsResponse,
  JellyfinPlaybackInfo,
  CreateJellyfinUserDto,
  UpdateUserPolicyDto,
} from '../common/interfaces/jellyfin.interface';

@Injectable()
export class JellyfinService {
  private readonly logger = new Logger(JellyfinService.name);
  private readonly jellyfinUrl: string;
  private readonly apiKey: string;
  private readonly adminUsername: string;
  private readonly adminPassword: string;
  private readonly animeLibraryId: string;
  private axiosInstance: AxiosInstance;
  private adminToken: string;

  constructor(private configService: ConfigService) {
    this.jellyfinUrl = this.configService.get<string>('JELLYFIN_URL');
    this.apiKey = this.configService.get<string>('JELLYFIN_API_KEY');
    this.adminUsername = this.configService.get<string>('JELLYFIN_ADMIN_USERNAME');
    this.adminPassword = this.configService.get<string>('JELLYFIN_ADMIN_PASSWORD');
    this.animeLibraryId = this.configService.get<string>('JELLYFIN_ANIME_LIBRARY_ID');

    this.axiosInstance = axios.create({
      baseURL: this.jellyfinUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-Emby-Authorization': this.getAuthHeader(),
      },
    });

    // Initialize admin authentication
    this.initializeAdmin();
  }

  private async initializeAdmin() {
    try {
      const response = await this.authenticateUser(this.adminUsername, this.adminPassword);
      this.adminToken = response.AccessToken;
      this.logger.log('Admin authentication initialized');
    } catch (error) {
      this.logger.error('Failed to initialize admin authentication', error);
    }
  }

  private getAuthHeader(token?: string): string {
    const client = 'JellyfinAnimeBackend';
    const device = 'Server';
    const deviceId = 'jellyfin-anime-platform';
    const version = '1.0.0';

    let authHeader = `MediaBrowser Client="${client}", Device="${device}", DeviceId="${deviceId}", Version="${version}"`;

    if (token) {
      authHeader += `, Token="${token}"`;
    }

    return authHeader;
  }

  // ============= AUTHENTICATION =============

  async authenticateUser(username: string, password: string): Promise<JellyfinAuthResponse> {
    try {
      const response = await this.axiosInstance.post<JellyfinAuthResponse>(
        '/Users/AuthenticateByName',
        {
          Username: username,
          Pw: password,
        },
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Authentication failed for user: ${username}`, error);
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
  }

  async authenticateWithToken(userId: string, token: string): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get(`/Users/${userId}`, {
        headers: {
          'X-Emby-Authorization': this.getAuthHeader(token),
        },
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // ============= USER MANAGEMENT =============

  async createUser(dto: CreateJellyfinUserDto): Promise<JellyfinUser> {
    try {
      // Create user
      const createResponse = await this.axiosInstance.post<JellyfinUser>(
        '/Users/New',
        {
          Name: dto.Name,
          Password: dto.Password,
        },
        {
          headers: {
            'X-Emby-Authorization': this.getAuthHeader(this.adminToken),
          },
        },
      );

      const user = createResponse.data;

      // Update user policy to restrict access
      await this.updateUserPolicy(user.Id, {
        IsAdministrator: false,
        IsDisabled: false,
        EnabledFolders: [this.animeLibraryId],
        EnableAllFolders: false,
        EnableMediaPlayback: true,
      });

      this.logger.log(`Created Jellyfin user: ${dto.Name} (${user.Id})`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to create user: ${dto.Name}`, error);
      if (error.response?.status === 409) {
        throw new HttpException('Username already exists', HttpStatus.CONFLICT);
      }
      throw new HttpException('Failed to create user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateUserPolicy(userId: string, policy: UpdateUserPolicyDto): Promise<void> {
    try {
      await this.axiosInstance.post(
        `/Users/${userId}/Policy`,
        policy,
        {
          headers: {
            'X-Emby-Authorization': this.getAuthHeader(this.adminToken),
          },
        },
      );
      this.logger.log(`Updated policy for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to update user policy: ${userId}`, error);
      throw new HttpException('Failed to update user policy', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserById(userId: string, token: string): Promise<JellyfinUser> {
    try {
      const response = await this.axiosInstance.get<JellyfinUser>(
        `/Users/${userId}`,
        {
          headers: {
            'X-Emby-Authorization': this.getAuthHeader(token),
          },
        },
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get user: ${userId}`, error);
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`/Users/${userId}`, {
        headers: {
          'X-Emby-Authorization': this.getAuthHeader(this.adminToken),
        },
      });
      this.logger.log(`Deleted user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete user: ${userId}`, error);
      throw new HttpException('Failed to delete user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ============= LIBRARY & ITEMS =============

  async getAnimeList(
    userId: string,
    token: string,
    params?: {
      searchTerm?: string;
      sortBy?: string;
      sortOrder?: string;
      limit?: number;
      startIndex?: number;
      genres?: string[];
      years?: number[];
    },
  ): Promise<JellyfinItemsResponse> {
    try {
      const queryParams: any = {
        ParentId: this.animeLibraryId,
        IncludeItemTypes: 'Series',
        Recursive: true,
        Fields: 'Overview,Genres,CommunityRating,PremiereDate,ProductionYear',
        ImageTypeLimit: 1,
        EnableImageTypes: 'Primary,Backdrop,Logo',
        Limit: params?.limit || 50,
        StartIndex: params?.startIndex || 0,
      };

      if (params?.searchTerm) {
        queryParams.SearchTerm = params.searchTerm;
      }

      if (params?.sortBy) {
        queryParams.SortBy = params.sortBy;
        queryParams.SortOrder = params.sortOrder || 'Ascending';
      }

      if (params?.genres && params.genres.length > 0) {
        queryParams.Genres = params.genres.join(',');
      }

      if (params?.years && params.years.length > 0) {
        queryParams.Years = params.years.join(',');
      }

      const response = await this.axiosInstance.get<JellyfinItemsResponse>(
        `/Users/${userId}/Items`,
        {
          params: queryParams,
          headers: {
            'X-Emby-Authorization': this.getAuthHeader(token),
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get anime list', error);
      throw new HttpException('Failed to fetch anime list', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAnimeById(
    animeId: string,
    userId: string,
    token: string,
  ): Promise<JellyfinItem> {
    try {
      const response = await this.axiosInstance.get<JellyfinItem>(
        `/Users/${userId}/Items/${animeId}`,
        {
          params: {
            Fields: 'Overview,Genres,CommunityRating,PremiereDate,ProductionYear,Studios',
          },
          headers: {
            'X-Emby-Authorization': this.getAuthHeader(token),
          },
        },
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get anime: ${animeId}`, error);
      throw new HttpException('Anime not found', HttpStatus.NOT_FOUND);
    }
  }

  async getSeasons(
    seriesId: string,
    userId: string,
    token: string,
  ): Promise<JellyfinItem[]> {
    try {
      const response = await this.axiosInstance.get<JellyfinItemsResponse>(
        `/Shows/${seriesId}/Seasons`,
        {
          params: {
            UserId: userId,
            Fields: 'Overview',
          },
          headers: {
            'X-Emby-Authorization': this.getAuthHeader(token),
          },
        },
      );
      return response.data.Items;
    } catch (error) {
      this.logger.error(`Failed to get seasons for series: ${seriesId}`, error);
      throw new HttpException('Failed to fetch seasons', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getEpisodes(
    seriesId: string,
    seasonId: string | null,
    userId: string,
    token: string,
  ): Promise<JellyfinItem[]> {
    try {
      const params: any = {
        UserId: userId,
        SeriesId: seriesId,
        Fields: 'Overview,MediaStreams',
        IsMissing: false,
      };

      if (seasonId) {
        params.SeasonId = seasonId;
      }

      const response = await this.axiosInstance.get<JellyfinItemsResponse>(
        `/Shows/${seriesId}/Episodes`,
        {
          params,
          headers: {
            'X-Emby-Authorization': this.getAuthHeader(token),
          },
        },
      );
      return response.data.Items;
    } catch (error) {
      this.logger.error(`Failed to get episodes for series: ${seriesId}`, error);
      throw new HttpException('Failed to fetch episodes', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ============= PLAYBACK =============

  async getPlaybackInfo(
    itemId: string,
    userId: string,
    token: string,
  ): Promise<JellyfinPlaybackInfo> {
    try {
      const response = await this.axiosInstance.post<JellyfinPlaybackInfo>(
        `/Items/${itemId}/PlaybackInfo`,
        {
          UserId: userId,
          DeviceProfile: {
            MaxStreamingBitrate: 120000000,
            MusicStreamingTranscodingBitrate: 384000,
            DirectPlayProfiles: [
              { Container: 'webm', Type: 'Video' },
              { Container: 'mp4,m4v', Type: 'Video', VideoCodec: 'h264,vp8,vp9' },
              { Container: 'mkv', Type: 'Video', VideoCodec: 'h264,vp8,vp9' },
            ],
            TranscodingProfiles: [
              {
                Container: 'mp4',
                Type: 'Video',
                AudioCodec: 'aac',
                VideoCodec: 'h264',
                Protocol: 'hls',
              },
            ],
          },
        },
        {
          headers: {
            'X-Emby-Authorization': this.getAuthHeader(token),
          },
        },
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get playback info for item: ${itemId}`, error);
      throw new HttpException('Failed to get playback info', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  getStreamUrl(itemId: string, token: string, mediaSourceId?: string): string {
    const params = new URLSearchParams({
      Static: 'true',
      MediaSourceId: mediaSourceId || itemId,
      DeviceId: 'jellyfin-anime-platform',
      api_key: token,
    });

    return `${this.jellyfinUrl}/Videos/${itemId}/stream?${params.toString()}`;
  }

  getImageUrl(itemId: string, imageType: string = 'Primary'): string {
    return `${this.jellyfinUrl}/Items/${itemId}/Images/${imageType}`;
  }

  // ============= PLAYBACK PROGRESS =============

  async updatePlaybackProgress(
    itemId: string,
    userId: string,
    token: string,
    positionTicks: number,
    isPaused: boolean = false,
  ): Promise<void> {
    try {
      const endpoint = isPaused ? 'Progress' : 'Playing';
      await this.axiosInstance.post(
        `/Sessions/Playing/${endpoint}`,
        {
          ItemId: itemId,
          PositionTicks: positionTicks,
          IsPaused: isPaused,
        },
        {
          headers: {
            'X-Emby-Authorization': this.getAuthHeader(token),
          },
        },
      );
    } catch (error) {
      this.logger.error(`Failed to update playback progress for item: ${itemId}`, error);
    }
  }

  async markAsWatched(
    itemId: string,
    userId: string,
    token: string,
  ): Promise<void> {
    try {
      await this.axiosInstance.post(
        `/Users/${userId}/PlayedItems/${itemId}`,
        {},
        {
          headers: {
            'X-Emby-Authorization': this.getAuthHeader(token),
          },
        },
      );
    } catch (error) {
      this.logger.error(`Failed to mark as watched: ${itemId}`, error);
    }
  }

  async markAsUnwatched(
    itemId: string,
    userId: string,
    token: string,
  ): Promise<void> {
    try {
      await this.axiosInstance.delete(
        `/Users/${userId}/PlayedItems/${itemId}`,
        {
          headers: {
            'X-Emby-Authorization': this.getAuthHeader(token),
          },
        },
      );
    } catch (error) {
      this.logger.error(`Failed to mark as unwatched: ${itemId}`, error);
    }
  }

  // ============= FAVORITES =============

  async toggleFavorite(
    itemId: string,
    userId: string,
    token: string,
    isFavorite: boolean,
  ): Promise<void> {
    try {
      const method = isFavorite ? 'post' : 'delete';
      await this.axiosInstance[method](
        `/Users/${userId}/FavoriteItems/${itemId}`,
        {},
        {
          headers: {
            'X-Emby-Authorization': this.getAuthHeader(token),
          },
        },
      );
    } catch (error) {
      this.logger.error(`Failed to toggle favorite: ${itemId}`, error);
      throw new HttpException('Failed to update favorite status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
