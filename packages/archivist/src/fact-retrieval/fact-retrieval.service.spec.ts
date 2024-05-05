import { Test, TestingModule } from '@nestjs/testing';
import { FactRetrievalService } from './fact-retrieval.service';

describe('FactRetrievalService', () => {
  let service: FactRetrievalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FactRetrievalService],
    }).compile();

    service = module.get<FactRetrievalService>(FactRetrievalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
