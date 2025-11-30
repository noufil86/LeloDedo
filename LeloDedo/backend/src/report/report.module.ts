import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './report.entity';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { User } from '../user/user.entity';
import { Message } from '../message/message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report, User, Message])],
  providers: [ReportService],
  controllers: [ReportController],
  exports: [ReportService],
})
export class ReportModule {}
