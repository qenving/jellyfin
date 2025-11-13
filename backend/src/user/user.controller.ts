import {
  Controller,
  Get,
  Put,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UpdateUserDto, UpdatePreferencesDto } from './dto/update-user.dto';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.userService.getUserProfile(user.userId);
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.updateUserProfile(user.userId, dto);
  }

  @Get('preferences')
  async getPreferences(@CurrentUser() user: CurrentUserPayload) {
    return this.userService.getUserPreferences(user.userId);
  }

  @Put('preferences')
  @HttpCode(HttpStatus.OK)
  async updatePreferences(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.userService.updateUserPreferences(user.userId, dto);
  }

  @Get('stats')
  async getStats(@CurrentUser() user: CurrentUserPayload) {
    return this.userService.getUserStats(user.userId);
  }
}
