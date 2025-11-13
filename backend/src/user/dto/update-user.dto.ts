import { IsOptional, IsString, IsBoolean, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsBoolean()
  autoPlay?: boolean;

  @IsOptional()
  @IsBoolean()
  autoSkipIntro?: boolean;

  @IsOptional()
  @IsString()
  defaultQuality?: string;

  @IsOptional()
  @IsString()
  subtitleLang?: string;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;
}
