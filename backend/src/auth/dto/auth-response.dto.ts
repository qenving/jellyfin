export class AuthResponseDto {
  user: {
    id: string;
    username: string;
    email: string;
    displayName?: string;
    avatarUrl?: string;
    isAdmin: boolean;
  };
  token?: string; // Optional, karena kita gunakan HTTP-only cookie
}
