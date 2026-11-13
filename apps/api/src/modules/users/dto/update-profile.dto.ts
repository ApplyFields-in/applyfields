import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'date_of_birth must be a valid ISO date (YYYY-MM-DD)' },
  )
  date_of_birth?: string;

  @IsOptional()
  @IsIn(['male', 'female', 'transgender', 'prefer_not_to_say'])
  gender?: 'male' | 'female' | 'transgender' | 'prefer_not_to_say';

  @IsOptional()
  @IsIn(['GEN', 'OBC', 'SC', 'ST', 'EWS'])
  category?: 'GEN' | 'OBC' | 'SC' | 'ST' | 'EWS';

  @IsOptional()
  @IsBoolean()
  is_pwbd?: boolean;

  @IsOptional()
  @IsString()
  pwbd_type?: string;

  @IsOptional()
  @IsBoolean()
  is_ex_serviceman?: boolean;

  @IsOptional()
  @IsBoolean()
  is_minority?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  special_conditions?: string[];

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Annual family income cannot be negative' })
  annual_family_income?: number;

  @IsOptional()
  @Matches(/^[A-Z]{2}$/, {
    message: 'state_code must be a 2-letter uppercase code (e.g. AP, TS)',
  })
  state_code?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @Matches(/^[A-Z]{2}$/, {
    message:
      'domicile_state_code must be a 2-letter uppercase code (e.g. AP, TS)',
  })
  domicile_state_code?: string;

  @IsOptional()
  @IsString()
  preferred_language?: string;

  /** A pixel avatar id, an https photo URL (Google login), or an uploaded photo
   *  as a data URL. 70,000 chars of base64 ≈ the 50 KB photo limit. */
  @IsOptional()
  @IsString()
  @MaxLength(70_000, { message: 'Profile photo must be under 50 KB' })
  @Matches(
    /^(pixel-[a-z0-9-]+|https:\/\/\S+|data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*)$/,
    { message: 'avatar_url must be a pixel avatar, an https URL or a PNG/JPEG/WebP photo' },
  )
  avatar_url?: string;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @IsOptional()
  @IsString()
  handle?: string;
}

