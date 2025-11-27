import { Test, TestingModule } from '@nestjs/testing';
import { ToolCategoryService } from './tool-category.service';

describe('ToolCategoryService', () => {
  let service: ToolCategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ToolCategoryService],
    }).compile();

    service = module.get<ToolCategoryService>(ToolCategoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
