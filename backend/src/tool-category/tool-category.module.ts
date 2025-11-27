import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ToolCategory } from './tool-category.entity';
import { ToolCategoryService } from './tool-category.service';
import { ToolCategoryController } from './tool-category.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ToolCategory])],
  controllers: [ToolCategoryController],
  providers: [ToolCategoryService],
  exports: [ToolCategoryService],
})
export class ToolCategoryModule {}
