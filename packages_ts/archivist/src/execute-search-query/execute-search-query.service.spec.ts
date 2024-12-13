import { Test, TestingModule } from '@nestjs/testing';
import { ExecuteSearchQueryService } from './execute-search-query.service';

describe('ExecuteSearchQueryService', () => {
  let service: ExecuteSearchQueryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExecuteSearchQueryService],
    }).compile();

    service = module.get<ExecuteSearchQueryService>(ExecuteSearchQueryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
