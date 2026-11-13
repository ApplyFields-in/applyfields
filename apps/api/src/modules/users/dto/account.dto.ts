import { IsIn, IsOptional, IsString } from 'class-validator';

export class DeleteAccountDto {
  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  code?: string;
}

export class StartChangeContactDto {
  @IsIn(['email', 'phone'])
  type: 'email' | 'phone';

  @IsString()
  value: string;
}

export class VerifyChangeContactDto {
  @IsIn(['email', 'phone'])
  type: 'email' | 'phone';

  @IsString()
  value: string;

  @IsString()
  code: string;
}
