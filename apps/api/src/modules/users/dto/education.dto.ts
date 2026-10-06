import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateEducationDto {
  @IsNotEmpty()
  @IsIn(['10th', '12th', 'iti', 'diploma', 'graduate', 'post_graduate', 'phd'])
  level!: '10th' | '12th' | 'iti' | 'diploma' | 'graduate' | 'post_graduate' | 'phd';

  @IsOptional()
  @IsString()
  degree?: string;

  @IsOptional()
  @IsString()
  stream?: string;

  @IsOptional()
  @IsString()
  board_or_university?: string;

  @IsOptional()
  @IsString()
  institution_name?: string;

  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(2100)
  year_of_passing?: number;

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsIn(['percentage', 'cgpa', 'grade'])
  score_type?: 'percentage' | 'cgpa' | 'grade';

  @IsOptional()
  @IsIn(['completed', 'pursuing'])
  status?: 'completed' | 'pursuing';
}

export class UpdateEducationDto extends CreateEducationDto {}
