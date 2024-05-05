import { Test, TestingModule } from '@nestjs/testing';
import { EntityRetrievalService } from './entity-retrieval.service';

describe('EntityRetrievalService', () => {
  let service: EntityRetrievalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EntityRetrievalService],
    }).compile();

    service = module.get<EntityRetrievalService>(EntityRetrievalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
