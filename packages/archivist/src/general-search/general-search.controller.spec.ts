import { Test, TestingModule } from '@nestjs/testing';
import { GeneralSearchController } from './general-search.controller';

describe('GeneralSearchController', () => {
  let controller: GeneralSearchController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeneralSearchController],
    }).compile();

    controller = module.get<GeneralSearchController>(GeneralSearchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
