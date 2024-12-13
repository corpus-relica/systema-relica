import { Test, TestingModule } from '@nestjs/testing';
import { IndividualSearchService } from './individual-search.service';

describe('IndividualSearchService', () => {
  let service: IndividualSearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IndividualSearchService],
    }).compile();

    service = module.get<IndividualSearchService>(IndividualSearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
