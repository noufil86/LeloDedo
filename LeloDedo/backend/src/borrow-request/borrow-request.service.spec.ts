import { Test, TestingModule } from '@nestjs/testing';
import { BorrowRequestService } from './borrow-request.service';

describe('BorrowRequestService', () => {
  let service: BorrowRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BorrowRequestService],
    }).compile();

    service = module.get<BorrowRequestService>(BorrowRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
