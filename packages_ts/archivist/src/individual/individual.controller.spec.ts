import { Test, TestingModule } from '@nestjs/testing';
import { IndividualController } from './individual.controller';

describe('IndividualController', () => {
  let controller: IndividualController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IndividualController],
    }).compile();

    controller = module.get<IndividualController>(IndividualController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
