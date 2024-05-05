import { Test, TestingModule } from '@nestjs/testing';
import { GeneralSearchService } from './general-search.service';

describe('GeneralSearchService', () => {
  let service: GeneralSearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeneralSearchService],
    }).compile();

    service = module.get<GeneralSearchService>(GeneralSearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
