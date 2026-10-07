import { IsIn, IsNotEmpty, IsString, Length } from 'class-validator';

export class SendOtpDto {
  @IsNotEmpty({ message: 'Target (email or phone) is required' })
  @IsString()
  target!: string;

  @IsNotEmpty()
  @IsIn(['verify_email', 'verify_phone', 'login', 'reset_password'], {
    message:
      'Purpose must be verify_email, verify_phone, login, or reset_password',
  })
  purpose!: 'verify_email' | 'verify_phone' | 'login' | 'reset_password';
}

export class VerifyOtpDto {
  @IsNotEmpty({ message: 'Target (email or phone) is required' })
  @IsString()
  target!: string;

  @IsNotEmpty()
  @IsIn(['verify_email', 'verify_phone', 'login', 'reset_password'], {
    message:
      'Purpose must be verify_email, verify_phone, login, or reset_password',
  })
  purpose!: 'verify_email' | 'verify_phone' | 'login' | 'reset_password';

  @IsNotEmpty({ message: 'OTP code is required' })
  @IsString()
  @Length(6, 6, { message: 'OTP code must be exactly 6 digits' })
  code!: string;
}

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Target (email or phone) is required' })
  @IsString()
  target!: string;

  @IsNotEmpty({ message: 'OTP code is required' })
  @IsString()
  @Length(6, 6, { message: 'OTP code must be exactly 6 digits' })
  code!: string;

  @IsNotEmpty({ message: 'New password is required' })
  @IsString()
  newPassword!: string;
}
