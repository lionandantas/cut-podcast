import { Test, TestingModule } from '@nestjs/testing';
import { DownloadVideoService } from './download-video.service';

describe('DownloadVideoService', () => {
  let service: DownloadVideoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DownloadVideoService],
    }).compile();

    service = module.get<DownloadVideoService>(DownloadVideoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
