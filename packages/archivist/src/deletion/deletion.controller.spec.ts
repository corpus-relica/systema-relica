import { Test, TestingModule } from '@nestjs/testing';
import { DeletionController } from './deletion.controller';

describe('DeletionController', () => {
  let controller: DeletionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeletionController],
    }).compile();

    controller = module.get<DeletionController>(DeletionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
