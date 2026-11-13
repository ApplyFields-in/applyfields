import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateExamScoreDto {
  @IsString()
  exam_type: string;

  @IsString()
  exam_name: string;

  @IsInt()
  year: number;

  @IsOptional()
  @IsString()
  roll_number?: string;

  @IsOptional()
  @IsString()
  registration_number?: string;

  @IsOptional()
  @IsString()
  discipline_or_paper?: string;

  @IsOptional()
  @IsString()
  score?: string;

  @IsOptional()
  @IsString()
  marks?: string;

  @IsOptional()
  @IsString()
  percentile?: string;

  @IsOptional()
  @IsString()
  all_india_rank?: string;

  @IsOptional()
  @IsString()
  category_rank?: string;

  @IsOptional()
  @IsString()
  award_or_status?: string;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}

export class UpdateExamScoreDto {
  @IsOptional()
  @IsString()
  exam_type?: string;

  @IsOptional()
  @IsString()
  exam_name?: string;

  @IsOptional()
  @IsInt()
  year?: number;

  @IsOptional()
  @IsString()
  roll_number?: string;

  @IsOptional()
  @IsString()
  registration_number?: string;

  @IsOptional()
  @IsString()
  discipline_or_paper?: string;

  @IsOptional()
  @IsString()
  score?: string;

  @IsOptional()
  @IsString()
  marks?: string;

  @IsOptional()
  @IsString()
  percentile?: string;

  @IsOptional()
  @IsString()
  all_india_rank?: string;

  @IsOptional()
  @IsString()
  category_rank?: string;

  @IsOptional()
  @IsString()
  award_or_status?: string;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}
