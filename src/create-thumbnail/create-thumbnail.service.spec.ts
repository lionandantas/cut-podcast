import { Test, TestingModule } from '@nestjs/testing';
import { CreateThumbnailService } from './create-thumbnail.service';

describe('CreateThumbnailService', () => {
  let service: CreateThumbnailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateThumbnailService],
    }).compile();

    service = module.get<CreateThumbnailService>(CreateThumbnailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
