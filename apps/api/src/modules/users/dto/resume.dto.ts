import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UploadResumeDto {
  @IsNotEmpty({ message: 'File name is required' })
  @IsString()
  fileName!: string;

  @IsNotEmpty({ message: 'MIME type is required' })
  @IsString()
  mimeType!: string;

  @IsNotEmpty({ message: 'File base64 content is required' })
  @IsString()
  fileBase64!: string;

  @IsOptional()
  @IsString()
  text?: string;
}
