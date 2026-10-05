import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength, ValidateIf } from 'class-validator';

export class RegisterDto {
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  email?: string;

  @IsOptional()
  @Matches(/^\+91[1-9]\d{9}$/, {
    message: 'Phone number must be in +91XXXXXXXXXX format',
  })
  phone?: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @ValidateIf((o) => !o.email && !o.phone)
  @IsNotEmpty({ message: 'Either email or phone is required' })
  identifierCheck?: string;
}
