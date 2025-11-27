import { IsNumber, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateMessageReportDto {
  @IsNumber()
  message_id: number;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  reason: string; // e.g., "HARASSMENT", "INAPPROPRIATE", "SPAM"

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
