import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { CreateEducationDto, UpdateEducationDto } from './dto/education.dto.js';
import { AuthGuard, type AuthenticatedRequest } from '../auth/auth.guard.js';

@Controller('me')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.getMe(req.user.userId);
  }

  @Put('profile')
  updateProfile(@Req() req: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @Get('education')
  getEducation(@Req() req: AuthenticatedRequest) {
    return this.usersService.getEducation(req.user.userId);
  }

  @Post('education')
  addEducation(@Req() req: AuthenticatedRequest, @Body() dto: CreateEducationDto) {
    return this.usersService.addEducation(req.user.userId, dto);
  }

  @Put('education/:id')
  updateEducation(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateEducationDto,
  ) {
    return this.usersService.updateEducation(id, req.user.userId, dto);
  }

  @Delete('education/:id')
  deleteEducation(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.usersService.deleteEducation(id, req.user.userId);
  }
}
