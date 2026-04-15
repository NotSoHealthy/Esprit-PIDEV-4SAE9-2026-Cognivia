import { TestBed } from '@angular/core/testing';
import { EquipmentService } from './equipment-service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/api/api.tokens';

describe('EquipmentService', () => {
  let service: EquipmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EquipmentService,
        { provide: API_BASE_URL, useValue: 'http://api-test' }
      ]
    });
    service = TestBed.inject(EquipmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
