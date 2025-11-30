import { IsString, IsOptional } from 'class-validator';

export class IgnoreReportDto {
  @IsString()
  @IsOptional()
  admin_notes?: string;
}
