import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
}

export class PasskeyLoginDto {
  @IsNotEmpty({ message: 'Registered email or phone number is required to sign in with passkey' })
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
