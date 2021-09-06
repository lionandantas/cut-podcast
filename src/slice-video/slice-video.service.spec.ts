import { Test, TestingModule } from '@nestjs/testing';
import { SliceVideoService } from './slice-video.service';

describe('SliceVideoService', () => {
  let service: SliceVideoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SliceVideoService],
    }).compile();

    service = module.get<SliceVideoService>(SliceVideoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
