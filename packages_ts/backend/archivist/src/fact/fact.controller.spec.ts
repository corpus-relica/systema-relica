import { Test, TestingModule } from '@nestjs/testing';
import { FactController } from './fact.controller';

describe('FactController', () => {
  let controller: FactController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FactController],
    }).compile();

    controller = module.get<FactController>(FactController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
