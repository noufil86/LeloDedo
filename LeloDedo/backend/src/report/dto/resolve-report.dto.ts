import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class ResolveReportDto {
  @IsNumber()
  @Min(1)
  @Max(365)
  ban_duration_days: number;

  @IsString()
  @IsOptional()
  admin_notes?: string;
}
