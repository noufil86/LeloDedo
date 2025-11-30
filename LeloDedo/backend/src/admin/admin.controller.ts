import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';

import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // -------------------------
  // USER MANAGEMENT
  // -------------------------

  @Get('users')
  getAllUsers() {
    return this.adminService.findAllUsers();
  }

  @Get('users/:id')
  getUser(@Param('id') id: number) {
    return this.adminService.findUser(id);
  }

  @Patch('users/:id/role')
  updateRole(@Param('id') id: number, @Body() body: { role: string }) {
    return this.adminService.updateUserRole(id, body.role);
  }

  @Patch('users/:id/suspend')
  suspend(
    @Param('id') id: number,
    @Body() body: { reason: string },
  ) {
    return this.adminService.suspendUser(id, body.reason);
  }

  @Patch('users/:id/unsuspend')
  unsuspend(@Param('id') id: number) {
    return this.adminService.unsuspendUser(id);
  }

  @Patch('users/:id/verify')
  verifyUser(@Param('id') id: number) {
    return this.adminService.verifyUser(id);
  }

  @Patch('users/:id/warn')
  warnUser(@Param('id') id: number, @Body() body: { reason: string }) {
    return this.adminService.warnUser(id, body.reason);
  }

  @Patch('users/:id/ban')
  banUser(
    @Param('id') id: number,
    @Body() body: { duration_days: number; reason: string },
  ) {
    return this.adminService.banUser(id, body.duration_days, body.reason);
  }

  @Patch('users/:id/unban')
  unbanUser(@Param('id') id: number) {
    return this.adminService.unbanUser(id);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: number) {
    return this.adminService.deleteUser(id);
  }

  // -------------------------
  // USER SEARCH
  // -------------------------

  @Get('search/users')
  searchUsers(
    @Query('name') name?: string,
    @Query('email') email?: string,
    @Query('role') role?: string,
    @Query('warning_count') warning_count?: number,
    @Query('banned') banned?: string,
  ) {
    return this.adminService.searchUsers({
      name,
      email,
      role,
      warning_count: warning_count ? Number(warning_count) : undefined,
      banned: banned === 'true' ? true : banned === 'false' ? false : undefined,
    });
  }

  // -------------------------
  // SYSTEM ANALYTICS
  // -------------------------

  @Get('stats')
  stats() {
    return this.adminService.systemStats();
  }

  @Get('overdue')
  overdueItems() {
    return this.adminService.listOverdue();
  }

  // -------------------------
  // MESSAGING AUDIT
  // -------------------------

  @Get('conversations')
  allConversations() {
    return this.adminService.viewAllConversations();
  }

  @Get('conversations/:id')
  viewConversation(@Param('id') id: number) {
    return this.adminService.viewConversation(id);
  }

  @Get('borrow-request/:borrowRequestId/conversation')
  viewConversationByBorrowRequest(@Param('borrowRequestId') borrowRequestId: number) {
    return this.adminService.viewConversationByBorrowRequest(borrowRequestId);
  }

  @Get('users/:borrowerId/conversations/:lenderId')
  viewMessagesBetweenUsers(
    @Param('borrowerId') borrowerId: number,
    @Param('lenderId') lenderId: number,
  ) {
    return this.adminService.viewMessagesBetweenUsers(borrowerId, lenderId);
  }

  @Get('users/:userId/conversations')
  viewUserConversations(@Param('userId') userId: number) {
    return this.adminService.viewUserConversations(userId);
  }

  // -------------------------
  // ANALYTICS ENDPOINTS
  // -------------------------

  @Get('analytics/top-borrowed-items')
  topBorrowedItems(@Query('limit') limit = '10') {
    return this.adminService.getTopBorrowedItems(parseInt(limit as string) || 10);
  }

  @Get('analytics/active-lenders')
  activeLenders(@Query('limit') limit = '10') {
    return this.adminService.getActiveLenders(parseInt(limit as string) || 10);
  }

  @Get('analytics/overdue-rate')
  overdueRate() {
    return this.adminService.getOverdueRate();
  }

  @Get('analytics/daily-signups')
  dailySignups(@Query('days') days = '30') {
    return this.adminService.getDailySignups(parseInt(days as string) || 30);
  }

  @Get('analytics/by-category')
  itemsByCategory() {
    return this.adminService.getItemsByCategory();
  }

  @Get('analytics/success-rate')
  borrowSuccessRate() {
    return this.adminService.getBorrowSuccessRate();
  }

  @Get('analytics/avg-borrow-duration')
  averageBorrowDuration() {
    return this.adminService.getAverageBorrowDuration();
  }

  @Get('analytics/active-borrowers')
  activeBorrowers(@Query('limit') limit = '10') {
    return this.adminService.getMostActiveBorrowers(parseInt(limit as string) || 10);
  }

  @Get('analytics/user-growth')
  userGrowthMetrics() {
    return this.adminService.getUserGrowthMetrics();
  }

  @Get('analytics/item-availability')
  itemAvailabilityStats() {
    return this.adminService.getItemAvailabilityStats();
  }
}
