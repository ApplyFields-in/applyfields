import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersStore } from './users.store.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';
import type { CreateEducationDto, UpdateEducationDto } from './dto/education.dto.js';
import type { MeResponse, UserEducation, UserProfile } from '@applyfields/types';

@Injectable()
export class UsersService {
  constructor(private readonly store: UsersStore) {}

  async getMe(userId: string): Promise<MeResponse> {
    const user = await this.store.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const profile = (await this.store.getProfile(userId)) ?? null;
    const education = await this.store.getUserEducation(userId);

    return {
      user: this.store.toUserSummary(user),
      profile,
      education,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserProfile> {
    const user = await this.store.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return await this.store.updateProfile(userId, dto);
  }

  async getEducation(userId: string): Promise<UserEducation[]> {
    return await this.store.getUserEducation(userId);
  }

  async addEducation(userId: string, dto: CreateEducationDto): Promise<UserEducation> {
    return await this.store.addEducation(userId, {
      level: dto.level,
      degree: dto.degree ?? null,
      stream: dto.stream ?? null,
      board_or_university: dto.board_or_university ?? null,
      institution_name: dto.institution_name ?? null,
      year_of_passing: dto.year_of_passing ?? null,
      score: dto.score ?? null,
      score_type: dto.score_type ?? null,
      status: dto.status ?? 'completed',
    });
  }

  async updateEducation(id: string, userId: string, dto: UpdateEducationDto): Promise<UserEducation> {
    const updated = await this.store.updateEducation(id, userId, dto);
    if (!updated) {
      throw new NotFoundException('Education record not found');
    }
    return updated;
  }

  async deleteEducation(id: string, userId: string): Promise<{ success: boolean }> {
    const deleted = await this.store.deleteEducation(id, userId);
    if (!deleted) {
      throw new NotFoundException('Education record not found');
    }
    return { success: true };
  }
}
