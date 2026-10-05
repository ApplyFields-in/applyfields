import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Email or phone number is required' })
  @IsString()
  identifier!: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  password!: string;
}

export class LoginOtpDto {
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  phone!: string;

  @IsNotEmpty({ message: 'OTP code is required' })
  @IsString()
  code!: string;
}
