import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus, ReportType } from './report.entity';
import { User } from '../user/user.entity';
import { Message } from '../message/message.entity';
import { CreateUserReportDto } from './dto/create-user-report.dto';
import { CreateMessageReportDto } from './dto/create-message-report.dto';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  /**
   * Report a user for inappropriate behavior
   */
  async createUserReport(
    reporterUserId: number,
    dto: CreateUserReportDto,
  ): Promise<Report> {
    const { reported_user_id, reason, description } = dto;

    // Check if reporter exists
    const reporter = await this.userRepository.findOne({
      where: { user_id: reporterUserId },
    });
    if (!reporter) {
      throw new BadRequestException('Reporter user not found');
    }

    // Check if reported user exists
    const reportedUser = await this.userRepository.findOne({
      where: { user_id: reported_user_id },
    });
    if (!reportedUser) {
      throw new BadRequestException('Reported user not found');
    }

    // Prevent self-reporting
    if (reporterUserId === reported_user_id) {
      throw new BadRequestException('Cannot report yourself');
    }

    // Check for existing pending report from same reporter for same user
    const existingReport = await this.reportRepository.findOne({
      where: {
        reported_user_id,
        reporter_id: reporterUserId,
        status: ReportStatus.PENDING,
      },
    });

    if (existingReport) {
      throw new BadRequestException(
        'You already have a pending report for this user',
      );
    }

    // Create report
    const report = this.reportRepository.create({
      report_type: ReportType.USER,
      reported_user_id,
      reporter_id: reporterUserId,
      reason,
      description,
      status: ReportStatus.PENDING,
    });

    return this.reportRepository.save(report);
  }

  /**
   * Report a message as inappropriate
   */
  async createMessageReport(
    reporterUserId: number,
    dto: CreateMessageReportDto,
  ): Promise<Report> {
    const { message_id, reason, description } = dto;

    // Check if reporter exists
    const reporter = await this.userRepository.findOne({
      where: { user_id: reporterUserId },
    });
    if (!reporter) {
      throw new BadRequestException('Reporter user not found');
    }

    // Check if message exists
    const message = await this.messageRepository.findOne({
      where: { message_id },
      relations: ['sender'],
    });
    if (!message) {
      throw new BadRequestException('Message not found');
    }

    // Prevent reporting own messages (but allow if needed for moderation)
    // Commented out to allow self-reporting edge cases
    // if (reporterUserId === message.sender_id) {
    //   throw new BadRequestException('Cannot report your own message');
    // }

    // Check for existing pending report
    const existingReport = await this.reportRepository.findOne({
      where: {
        message_id,
        reporter_id: reporterUserId,
        status: ReportStatus.PENDING,
      },
    });

    if (existingReport) {
      throw new BadRequestException(
        'You already have a pending report for this message',
      );
    }

    // Create report
    const report = this.reportRepository.create({
      report_type: ReportType.MESSAGE,
      message_id,
      reported_user_id: message.sender?.user_id, // Store sender as reported user
      reporter_id: reporterUserId,
      reason,
      description,
      status: ReportStatus.PENDING,
    });

    return this.reportRepository.save(report);
  }

  /**
   * List all reports (for admin)
   */
  async listReports(status?: ReportStatus): Promise<Report[]> {
    const query = this.reportRepository.createQueryBuilder('report');

    if (status) {
      query.where('report.status = :status', { status });
    }

    return query
      .orderBy('report.created_at', 'DESC')
      .addOrderBy('report.status', 'ASC')
      .leftJoinAndSelect('report.reported_user', 'reported_user')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .leftJoinAndSelect('report.message', 'message')
      .getMany();
  }

  /**
   * Get a single report by ID
   */
  async getReportById(reportId: number): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { report_id: reportId },
      relations: ['reported_user', 'reporter', 'message'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  /**
   * Resolve a report (admin bans user for specified duration)
   */
  async resolveReport(
    reportId: number,
    banDurationDays: number,
    adminNotes: string,
  ): Promise<Report> {
    const report = await this.getReportById(reportId);

    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException(
        'Only pending reports can be resolved',
      );
    }

    // Ban the reported user
    const banUntil = new Date();
    banUntil.setDate(banUntil.getDate() + banDurationDays);

    await this.userRepository.update(
      { user_id: report.reported_user_id },
      {
        ban_until: banUntil,
        ban_reason: `Report #${reportId}: ${report.reason}`,
      },
    );

    // Update report status
    report.status = ReportStatus.RESOLVED;
    report.admin_notes = adminNotes;

    return this.reportRepository.save(report);
  }

  /**
   * Ignore a report (dismiss without action)
   */
  async ignoreReport(reportId: number, adminNotes: string): Promise<Report> {
    const report = await this.getReportById(reportId);

    if (report.status !== ReportStatus.PENDING) {
      throw new BadRequestException(
        'Only pending reports can be ignored',
      );
    }

    report.status = ReportStatus.IGNORED;
    report.admin_notes = adminNotes;

    return this.reportRepository.save(report);
  }

  /**
   * Get reports for a specific user (admin view)
   */
  async getReportsForUser(userId: number): Promise<Report[]> {
    return this.reportRepository.find({
      where: { reported_user_id: userId },
      relations: ['reported_user', 'reporter', 'message'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get statistics on reports
   */
  async getReportStats(): Promise<{
    total: number;
    pending: number;
    resolved: number;
    ignored: number;
  }> {
    const [total, pending, resolved, ignored] = await Promise.all([
      this.reportRepository.count(),
      this.reportRepository.count({ where: { status: ReportStatus.PENDING } }),
      this.reportRepository.count({ where: { status: ReportStatus.RESOLVED } }),
      this.reportRepository.count({ where: { status: ReportStatus.IGNORED } }),
    ]);

    return { total, pending, resolved, ignored };
  }
}
