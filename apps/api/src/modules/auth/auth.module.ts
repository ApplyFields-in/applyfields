import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthGuard } from './auth.guard.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret:
        process.env.JWT_ACCESS_SECRET ?? 'applyfields_dev_jwt_access_secret_32bytes_min_key',
      signOptions: { expiresIn: (process.env.JWT_ACCESS_TTL ?? '7d') as any },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard, JwtModule],
})
export class AuthModule {}
