import { Test, TestingModule } from '@nestjs/testing';
import { EntityRetrievalController } from './entity-retrieval.controller';

describe('EntityRetrievalController', () => {
  let controller: EntityRetrievalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntityRetrievalController],
    }).compile();

    controller = module.get<EntityRetrievalController>(EntityRetrievalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
