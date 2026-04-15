import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../../core/api/api.tokens';
import { MaintenanceService } from './maintenance.service';

describe('MaintenanceService', () => {
  let service: MaintenanceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MaintenanceService, { provide: API_BASE_URL, useValue: 'http://api-test' }],
    });

    service = TestBed.inject(MaintenanceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads maintenances for an equipment', () => {
    service.getMaintenanceByEquipmentId(7).subscribe((data) => {
      expect(data).toEqual([]);
    });

    const req = httpMock.expectOne('http://api-test/Equipment/maintenance/equipment/7');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('creates, updates, deletes and checks maintenance availability', () => {
    const payload = {
      equipment: { id: 7 } as any,
      maintenanceTime: '2026-12-31T10:00:00',
      maintenanceCompletionTime: '2026-12-31T11:00:00',
      description: 'Replace parts',
      status: 'SCHEDULED',
    } as any;

    service.create(payload).subscribe((created) => {
      expect(created.id).toBe(4);
    });
    const createReq = httpMock.expectOne('http://api-test/Equipment/maintenance');
    expect(createReq.request.method).toBe('POST');
    createReq.flush({ ...payload, id: 4 });

    service.update({ ...payload, id: 4 }).subscribe((updated) => {
      expect(updated.id).toBe(4);
    });
    const updateReq = httpMock.expectOne('http://api-test/Equipment/maintenance/4');
    expect(updateReq.request.method).toBe('PUT');
    updateReq.flush({ ...payload, id: 4 });

    service.checkAvailability(7, '2026-12-31T10:00:00', '2026-12-31T11:00:00').subscribe((result) => {
      expect(result).toBeNull();
    });
    const checkReq = httpMock.expectOne((request) => request.url === 'http://api-test/Equipment/maintenance/checkavail');
    expect(checkReq.request.method).toBe('GET');
    expect(checkReq.request.params.get('equipmentId')).toBe('7');
    checkReq.flush(null);

    service.getClosestMaintenance(7).subscribe((result) => {
      expect(result).toEqual({ id: 8 } as any);
    });
    const closestReq = httpMock.expectOne('http://api-test/Equipment/maintenance/closest/7');
    expect(closestReq.request.method).toBe('GET');
    closestReq.flush({ id: 8 });

    service.delete(4).subscribe((result) => {
      expect(result).toBeNull();
    });
    const deleteReq = httpMock.expectOne('http://api-test/Equipment/maintenance/4');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(null);
  });
});