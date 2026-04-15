import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/api/api.tokens';
import { EquipmentService, UpdateEquipmentPartRequest } from './equipment-service';

describe('EquipmentService', () => {
  let service: EquipmentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EquipmentService, { provide: API_BASE_URL, useValue: 'http://api-test' }],
    });

    service = TestBed.inject(EquipmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetches all equipments from the API', () => {
    const response = [{ id: 1, name: 'Bed' } as any];

    service.getAll().subscribe((data) => {
      expect(data).toEqual(response);
    });

    const req = httpMock.expectOne('http://api-test/Equipment/equipment');
    expect(req.request.method).toBe('GET');
    req.flush(response);
  });

  it('uploads an image and maps the returned URL', () => {
    const file = new File(['image'], 'equipment.png', { type: 'image/png' });

    service.uploadImage(file).subscribe((url) => {
      expect(url).toBe('https://cdn.example/image.png');
    });

    const req = httpMock.expectOne('https://api.imgbb.com/1/upload?key=6917397c87588ed4436eac425b613c6e');
    expect(req.request.method).toBe('POST');
    expect((req.request.body as FormData).get('image')).toBe(file);
    req.flush({ data: { url: 'https://cdn.example/image.png' } });
  });

  it('creates and deletes equipment parts through the expected endpoints', () => {
    const part = {
      equipmentId: 3,
      name: 'Handle',
      conditionScore: 70,
      x: 0.1,
      y: 0.2,
      width: 0.3,
      height: 0.4,
    };

    service.createEquipmentPart(part).subscribe((created) => {
      expect(created.id).toBe(9);
    });

    const createReq = httpMock.expectOne('http://api-test/Equipment/equipment-parts');
    expect(createReq.request.method).toBe('POST');
    createReq.flush({ ...part, id: 9 });

    service.deleteEquipmentPart(9).subscribe((result) => {
      expect(result).toBeNull();
    });

    const deleteReq = httpMock.expectOne('http://api-test/Equipment/equipment-parts/9');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(null);
  });

  it('updates a part on the item endpoint and retries on 405', () => {
    const payload: UpdateEquipmentPartRequest = {
      id: 5,
      equipmentId: 2,
      name: 'Wheel',
      conditionScore: 60,
      x: 0.15,
      y: 0.25,
      width: 0.35,
      height: 0.45,
    };

    service.updateEquipmentPart(payload).subscribe((updated) => {
      expect(updated).toEqual({ ...payload });
    });

    const firstReq = httpMock.expectOne('http://api-test/Equipment/equipment-parts/5');
    expect(firstReq.request.method).toBe('PUT');
    firstReq.flush('Method Not Allowed', { status: 405, statusText: 'Method Not Allowed' });

    const retryReq = httpMock.expectOne('http://api-test/Equipment/equipment-parts');
    expect(retryReq.request.method).toBe('PUT');
    retryReq.flush({ ...payload });
  });
});
