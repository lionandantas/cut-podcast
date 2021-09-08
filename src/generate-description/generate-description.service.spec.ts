import { Test, TestingModule } from '@nestjs/testing';
import { GenerateDescriptionService } from './generate-description.service';

describe('GenerateDescriptionService', () => {
  let service: GenerateDescriptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GenerateDescriptionService],
    }).compile();

    service = module.get<GenerateDescriptionService>(GenerateDescriptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
