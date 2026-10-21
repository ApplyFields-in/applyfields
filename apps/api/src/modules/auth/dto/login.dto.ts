import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Email or phone number is required' })
  @IsString()
  identifier!: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  password!: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class LoginOtpDto {
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  phone!: string;

  @IsNotEmpty({ message: 'OTP code is required' })
  @IsString()
  code!: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class SocialLoginDto {
  @IsNotEmpty({ message: 'Provider is required' })
  @IsString()
  provider!: 'google' | 'apple' | 'microsoft';

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  idToken?: string;

  @IsOptional()
  @IsString()
  credential?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  sub?: string;
}

export class PasskeyLoginDto {
  @IsNotEmpty({
    message:
      'Registered email or phone number is required to sign in with passkey',
  })
  @IsString()
  email!: string;

  @IsOptional()
  @IsString()
  credentialId?: string;
}

export class PasskeyRegisterDto {
  @IsNotEmpty({ message: 'Credential ID is required to register passkey' })
  @IsString()
  credentialId!: string;

  @IsOptional()
  @IsString()
  credentialName?: string;
}
