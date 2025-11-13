export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  isAdmin: boolean;
}

export interface UserProfile extends User {
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  autoPlay: boolean;
  autoSkipIntro: boolean;
  defaultQuality: string;
  subtitleLang: string;
  theme: string;
  language: string;
  emailNotifications: boolean;
}

export interface UserStats {
  totalWatched: number;
  totalWatchlist: number;
  totalCompleted: number;
}

export interface AuthResponse {
  user: User;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  usernameOrEmail: string;
  password: string;
}
