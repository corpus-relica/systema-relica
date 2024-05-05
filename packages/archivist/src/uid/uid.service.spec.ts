import { Test, TestingModule } from '@nestjs/testing';
import { UidService } from './uid.service';

describe('UidService', () => {
  let service: UidService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UidService],
    }).compile();

    service = module.get<UidService>(UidService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
