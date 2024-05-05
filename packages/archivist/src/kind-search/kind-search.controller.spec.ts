import { Test, TestingModule } from '@nestjs/testing';
import { KindSearchController } from './kind-search.controller';

describe('KindSearchController', () => {
  let controller: KindSearchController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KindSearchController],
    }).compile();

    controller = module.get<KindSearchController>(KindSearchController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
