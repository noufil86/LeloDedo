import { IsNumber, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateUserReportDto {
  @IsNumber()
  reported_user_id: number;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  reason: string; // e.g., "HARASSMENT", "INAPPROPRIATE", "FRAUD"

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
