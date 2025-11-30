import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ReportService } from './report.service';
import { CreateUserReportDto } from './dto/create-user-report.dto';
import { CreateMessageReportDto } from './dto/create-message-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { IgnoreReportDto } from './dto/ignore-report.dto';
import { ReportStatus } from './report.entity';

@Controller('report')
export class ReportController {
  constructor(private reportService: ReportService) {}

  /**
   * Report a user for inappropriate behavior
   * POST /report/user/:userId
   */
  @Post('user/:userId')
  @UseGuards(AuthGuard('jwt'))
  async reportUser(
    @Param('userId') userId: number,
    @Body() dto: CreateUserReportDto,
    @Request() req,
  ) {
    const reporterId = req.user.user_id;
    dto.reported_user_id = userId;
    return this.reportService.createUserReport(reporterId, dto);
  }

  /**
   * Report a message as inappropriate
   * POST /report/message/:messageId
   */
  @Post('message/:messageId')
  @UseGuards(AuthGuard('jwt'))
  async reportMessage(
    @Param('messageId') messageId: number,
    @Body() dto: CreateMessageReportDto,
    @Request() req,
  ) {
    const reporterId = req.user.user_id;
    dto.message_id = messageId;
    return this.reportService.createMessageReport(reporterId, dto);
  }

  /**
   * Get all reports (admin only)
   * GET /report/admin/all
   * Query: status=PENDING|RESOLVED|IGNORED
   */
  @Get('admin/all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async getAllReports(@Query('status') status?: ReportStatus) {
    return this.reportService.listReports(status);
  }

  /**
   * Get reports for a specific user (admin only)
   * GET /report/admin/user/:userId
   */
  @Get('admin/user/:userId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async getReportsForUser(@Param('userId') userId: number) {
    return this.reportService.getReportsForUser(userId);
  }

  /**
   * Get report statistics (admin only)
   * GET /report/admin/stats
   */
  @Get('admin/stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async getReportStats() {
    return this.reportService.getReportStats();
  }

  /**
   * Get a single report (admin only)
   * GET /report/admin/:reportId
   */
  @Get('admin/:reportId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async getReport(@Param('reportId') reportId: number) {
    return this.reportService.getReportById(reportId);
  }

  /**
   * Resolve a report (admin bans the user)
   * PATCH /report/admin/:reportId/resolve
   */
  @Patch('admin/:reportId/resolve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async resolveReport(
    @Param('reportId') reportId: number,
    @Body() dto: ResolveReportDto,
  ) {
    return this.reportService.resolveReport(
      reportId,
      dto.ban_duration_days,
      dto.admin_notes,
    );
  }

  /**
   * Ignore a report (dismiss without action)
   * PATCH /report/admin/:reportId/ignore
   */
  @Patch('admin/:reportId/ignore')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  async ignoreReport(
    @Param('reportId') reportId: number,
    @Body() dto: IgnoreReportDto,
  ) {
    return this.reportService.ignoreReport(reportId, dto.admin_notes);
  }
}
