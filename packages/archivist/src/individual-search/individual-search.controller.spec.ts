import { Test, TestingModule } from '@nestjs/testing';
import { IndividualSearchController } from './individual-search.controller';

describe('IndividualSearchController', () => {
  let controller: IndividualSearchController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IndividualSearchController],
    }).compile();

    controller = module.get<IndividualSearchController>(IndividualSearchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
