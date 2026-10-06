import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsDateString({}, { message: 'date_of_birth must be a valid ISO date (YYYY-MM-DD)' })
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
  @Matches(/^[A-Z]{2}$/, { message: 'state_code must be a 2-letter uppercase code (e.g. AP, TS)' })
  state_code?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @Matches(/^[A-Z]{2}$/, {
    message: 'domicile_state_code must be a 2-letter uppercase code (e.g. AP, TS)',
  })
  domicile_state_code?: string;

  @IsOptional()
  @IsString()
  preferred_language?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;
}
