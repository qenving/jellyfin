import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto, UpdatePreferencesDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        isAdmin: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        isAdmin: true,
      },
    });

    return user;
  }

  async getUserPreferences(userId: string) {
    let preferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      // Create default preferences if not exist
      preferences = await this.prisma.userPreferences.create({
        data: { userId },
      });
    }

    return preferences;
  }

  async updateUserPreferences(userId: string, dto: UpdatePreferencesDto) {
    const preferences = await this.prisma.userPreferences.upsert({
      where: { userId },
      update: dto,
      create: {
        userId,
        ...dto,
      },
    });

    return preferences;
  }

  async getUserStats(userId: string) {
    const [watchHistoryCount, watchlistCount, completedCount] = await Promise.all([
      this.prisma.watchHistory.count({ where: { userId } }),
      this.prisma.watchlistItem.count({ where: { userId } }),
      this.prisma.watchHistory.count({ where: { userId, completed: true } }),
    ]);

    return {
      totalWatched: watchHistoryCount,
      totalWatchlist: watchlistCount,
      totalCompleted: completedCount,
    };
  }
}
