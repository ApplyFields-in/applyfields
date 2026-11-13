import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service.js';

@Controller('users')
export class PublicUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('public/:handle')
  async getPublicProfile(@Param('handle') handle: string) {
    return this.usersService.getPublicProfile(handle);
  }
}
