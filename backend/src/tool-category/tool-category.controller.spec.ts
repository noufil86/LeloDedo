import { Test, TestingModule } from '@nestjs/testing';
import { ToolCategoryController } from './tool-category.controller';

describe('ToolCategoryController', () => {
  let controller: ToolCategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToolCategoryController],
    }).compile();

    controller = module.get<ToolCategoryController>(ToolCategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
