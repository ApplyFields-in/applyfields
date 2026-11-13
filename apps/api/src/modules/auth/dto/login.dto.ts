import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString, Length, MaxLength } from 'class-validator';

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

/** Step 2 of password + code login. */
export class LoginVerifyDto extends LoginDto {
  @IsNotEmpty({ message: 'Verification code is required' })
  @IsString()
  @Length(6, 6, { message: 'Verification code must be exactly 6 digits' })
  code!: string;
}

export class LoginOtpDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  identifier?: string;

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

  /** Admin portal: sign in an existing account only, never create one. */
  @IsOptional()
  @IsBoolean()
  existingOnly?: boolean;

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

/** POST /auth/passkey/register/verify and /auth/passkey/login/verify: the browser's WebAuthn JSON + our signed challenge. */
export class PasskeyVerifyDto {
  @IsObject()
  response!: Record<string, unknown>;

  @IsNotEmpty()
  @IsString()
  challengeToken!: string;

  /** Label for a new passkey, e.g. "My phone". */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
