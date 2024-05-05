import { Test, TestingModule } from '@nestjs/testing';
import { FactRetrievalController } from './fact-retrieval.controller';

describe('FactRetrievalController', () => {
  let controller: FactRetrievalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FactRetrievalController],
    }).compile();

    controller = module.get<FactRetrievalController>(FactRetrievalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
