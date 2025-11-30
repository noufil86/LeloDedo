// src/borrow-request/borrow-request.controller.ts
import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';

import { BorrowRequestService } from './borrow-request.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('borrow-request')
@UseGuards(AuthGuard('jwt'))
export class BorrowRequestController {
  constructor(private service: BorrowRequestService) {}

  @Post()
  create(@Body() dto, @Req() req) {
    return this.service.create(dto, req.user.user_id);
  }

  @Get('sent')
  sent(@Req() req) {
    return this.service.myRequests(req.user.user_id);
  }

  @Get('incoming')
  incoming(@Req() req) {
    return this.service.myIncoming(req.user.user_id);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: number, @Req() req) {
    return this.service.approve(id, req.user.user_id);
  }

  @Patch(':id/decline')
  decline(@Param('id') id: number, @Req() req) {
    return this.service.decline(id, req.user.user_id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: number, @Req() req) {
    return this.service.cancel(id, req.user.user_id);
  }

  @Patch(':id/return-request')
  returnRequest(@Param('id') id: number, @Req() req) {
    return this.service.returnRequest(id, req.user.user_id);
  }

  @Patch(':id/confirm-return')
  confirmReturn(@Param('id') id: number, @Req() req) {
    return this.service.confirmReturn(id, req.user.user_id);
  }

  @Post(':id/extend-request')
  extendRequest(
    @Param('id') id: number,
    @Body() body: { extension_days: number },
    @Req() req,
  ) {
    return this.service.requestExtension(id, req.user.user_id, body.extension_days);
  }

  @Patch(':id/extend-approve')
  extendApprove(@Param('id') id: number, @Req() req) {
    return this.service.approveExtension(id, req.user.user_id);
  }

  @Patch(':id/extend-decline')
  extendDecline(@Param('id') id: number, @Req() req) {
    return this.service.declineExtension(id, req.user.user_id);
  }
}
