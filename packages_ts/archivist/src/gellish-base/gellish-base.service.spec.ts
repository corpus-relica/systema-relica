import { Test, TestingModule } from '@nestjs/testing';
import { GellishBaseService } from './gellish-base.service';

describe('GellishBaseService', () => {
  let service: GellishBaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GellishBaseService],
    }).compile();

    service = module.get<GellishBaseService>(GellishBaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
