import { Test, TestingModule } from '@nestjs/testing';
import { KindSearchService } from './kind-search.service';

describe('KindSearchService', () => {
  let service: KindSearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KindSearchService],
    }).compile();

    service = module.get<KindSearchService>(KindSearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
