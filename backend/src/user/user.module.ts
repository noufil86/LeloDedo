import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { BorrowRequest } from '../borrow-request/borrow-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, BorrowRequest])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
