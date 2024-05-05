import { Test, TestingModule } from '@nestjs/testing';
import { DeletionService } from './deletion.service';

describe('DeletionService', () => {
  let service: DeletionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeletionService],
    }).compile();

    service = module.get<DeletionService>(DeletionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
