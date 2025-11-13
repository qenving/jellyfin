// Jellyfin API Response Types

export interface JellyfinAuthResponse {
  User: {
    Id: string;
    Name: string;
    ServerId: string;
    Policy: any;
  };
  AccessToken: string;
  ServerId: string;
}

export interface JellyfinUser {
  Id: string;
  Name: string;
  ServerId: string;
  HasPassword: boolean;
  HasConfiguredPassword: boolean;
  HasConfiguredEasyPassword: boolean;
  EnableAutoLogin: boolean;
  LastLoginDate: string;
  LastActivityDate: string;
  Policy: JellyfinUserPolicy;
}

export interface JellyfinUserPolicy {
  IsAdministrator: boolean;
  IsHidden: boolean;
  IsDisabled: boolean;
  EnableAllFolders: boolean;
  EnabledFolders: string[];
  EnableContentDownloading: boolean;
  EnablePublicSharing: boolean;
  EnableMediaPlayback: boolean;
  EnableRemoteControlOfOtherUsers: boolean;
  EnablePlaybackRemuxing: boolean;
  EnableLiveTvManagement: boolean;
  EnableLiveTvAccess: boolean;
}

export interface JellyfinItem {
  Name: string;
  ServerId: string;
  Id: string;
  Type: string;
  UserData?: {
    PlaybackPositionTicks: number;
    PlayCount: number;
    IsFavorite: boolean;
    Played: boolean;
  };
  Overview?: string;
  CommunityRating?: number;
  PremiereDate?: string;
  ProductionYear?: number;
  ImageTags?: {
    Primary?: string;
    Backdrop?: string;
    Logo?: string;
  };
  BackdropImageTags?: string[];
  MediaType?: string;
  SeriesName?: string;
  SeriesId?: string;
  SeasonId?: string;
  IndexNumber?: number;
  ParentIndexNumber?: number;
  Genres?: string[];
  Studios?: { Name: string }[];
  RunTimeTicks?: number;
}

export interface JellyfinItemsResponse {
  Items: JellyfinItem[];
  TotalRecordCount: number;
  StartIndex: number;
}

export interface JellyfinPlaybackInfo {
  MediaSources: Array<{
    Id: string;
    Protocol: string;
    Container: string;
    Path: string;
    Type: string;
    Name: string;
    RunTimeTicks: number;
    SupportsDirectStream: boolean;
    SupportsDirectPlay: boolean;
    SupportsTranscoding: boolean;
    MediaStreams: Array<{
      Index: number;
      Type: string;
      Codec: string;
      Language?: string;
      DisplayTitle?: string;
    }>;
  }>;
}

export interface CreateJellyfinUserDto {
  Name: string;
  Password: string;
}

export interface UpdateUserPolicyDto {
  IsAdministrator?: boolean;
  IsDisabled?: boolean;
  EnabledFolders?: string[];
  EnableAllFolders?: boolean;
  EnableMediaPlayback?: boolean;
}
