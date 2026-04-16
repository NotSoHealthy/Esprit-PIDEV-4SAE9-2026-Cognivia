import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MedicationService } from './medication.service';
import { API_BASE_URL } from '../../../core/api/api.tokens';
import { MedicationModel, NewMedication } from '../models/medication.model';

describe('MedicationService', () => {
  let service: MedicationService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://api-gateway';

  const mockMedication: MedicationModel = {
    id: 1,
    name: 'Aspirin',
    imageUrl: 'http://example.com/aspirin.jpg'
  };

  const mockNewMedication: NewMedication = {
    name: 'Ibuprofen',
    imageUrl: 'http://example.com/ibuprofen.jpg'
  };

  const mockMedications: MedicationModel[] = [
    mockMedication,
    { id: 2, name: 'Paracetamol', imageUrl: 'http://example.com/paracetamol.jpg' },
    { id: 3, name: 'Amoxicillin', imageUrl: 'http://example.com/amoxicillin.jpg' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        MedicationService,
        { provide: API_BASE_URL, useValue: baseUrl }
      ]
    });
    service = TestBed.inject(MedicationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Retrieval Operations', () => {
    it('should get medications by pharmacy', () => {
      service.getByPharmacy(1).subscribe(result => {
        expect(result).toEqual(mockMedications);
        expect(result.length).toBe(3);
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/medications`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMedications);
    });

    it('should get all medications', () => {
      service.getAll().subscribe(result => {
        expect(result).toEqual(mockMedications);
        expect(result.length).toBe(3);
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/medications`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMedications);
    });

    it('should get medication by ID', () => {
      service.getById(1).subscribe(result => {
        expect(result).toEqual(mockMedication);
        expect(result.id).toBe(1);
        expect(result.name).toBe('Aspirin');
      });

      const req = httpMock.expectOne(`${baseUrl}/medications/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMedication);
    });

    it('should handle empty medication list', () => {
      service.getAll().subscribe(result => {
        expect(result).toEqual([]);
        expect(result.length).toBe(0);
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/medications`);
      req.flush([]);
    });
  });

  describe('CRUD Operations', () => {
    it('should create a new medication', () => {
      const newMedicationResponse: MedicationModel = { id: 4, ...mockNewMedication };

      service.create(mockNewMedication).subscribe(result => {
        expect(result).toEqual(newMedicationResponse);
        expect(result.id).toBe(4);
        expect(result.name).toBe('Ibuprofen');
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/medications`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockNewMedication);
      req.flush(newMedicationResponse);
    });

    it('should update a medication', () => {
      const updateData: Partial<MedicationModel> = { name: 'Updated Aspirin' };
      const updatedMedication: MedicationModel = { ...mockMedication, ...updateData };

      service.update(1, updateData).subscribe(result => {
        expect(result).toEqual(updatedMedication);
        expect(result.name).toBe('Updated Aspirin');
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/medications/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush(updatedMedication);
    });

    it('should delete a medication', () => {
      service.delete(1).subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/medications/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Image Upload Operations', () => {
    it('should upload medication image', () => {
      const mockFile = new File(['image content'], 'medication.jpg', { type: 'image/jpeg' });
      const updatedMedication: MedicationModel = {
        ...mockMedication,
        imageUrl: 'http://example.com/new-image.jpg'
      };

      service.uploadImage(1, mockFile).subscribe(result => {
        expect(result).toEqual(updatedMedication);
        expect(result.imageUrl).toBe('http://example.com/new-image.jpg');
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/medications/1/upload-image`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(updatedMedication);
    });

    it('should handle image upload with different file types', () => {
      const mockFile = new File(['image content'], 'medication.png', { type: 'image/png' });
      const updatedMedication: MedicationModel = {
        ...mockMedication,
        imageUrl: 'http://example.com/new-image.png'
      };

      service.uploadImage(2, mockFile).subscribe(result => {
        expect(result.imageUrl).toBe('http://example.com/new-image.png');
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/medications/2/upload-image`);
      expect(req.request.method).toBe('POST');
      req.flush(updatedMedication);
    });
  });

  describe('Medication Request Operations', () => {
    it('should get pending medications', () => {
      const pendingMedications = mockMedications.slice(0, 2);

      service.getPendingMedications().subscribe(result => {
        expect(result).toEqual(pendingMedications);
        expect(result.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/medications/pending`);
      expect(req.request.method).toBe('GET');
      req.flush(pendingMedications);
    });

    it('should handle empty pending medications list', () => {
      service.getPendingMedications().subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/medications/pending`);
      req.flush([]);
    });

    it('should get accepted medications', () => {
      const acceptedMedications = mockMedications;

      service.getAcceptedMedications().subscribe(result => {
        expect(result).toEqual(acceptedMedications);
        expect(result.length).toBe(3);
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/medications/accepted`);
      expect(req.request.method).toBe('GET');
      req.flush(acceptedMedications);
    });

    it('should handle empty accepted medications list', () => {
      service.getAcceptedMedications().subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/medications/accepted`);
      req.flush([]);
    });

    it('should accept a medication request', () => {
      const acceptedMedication: MedicationModel = {
        ...mockMedication,
        name: 'Aspirin (Accepted)'
      };

      service.acceptMedicationRequest(1).subscribe(result => {
        expect(result).toEqual(acceptedMedication);
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/medications/1/accept`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({});
      req.flush(acceptedMedication);
    });

    it('should patch and accept a medication', () => {
      const patchedMedication: MedicationModel = {
        ...mockMedication,
        name: 'Aspirin (Patched & Accepted)'
      };

      service.patchAndAcceptMedication(1).subscribe(result => {
        expect(result).toEqual(patchedMedication);
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/medications/1/patch-and-accept`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({});
      req.flush(patchedMedication);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP 500 error for getAll', () => {
      service.getAll().subscribe(
        () => fail('should have failed with 500 error'),
        (error) => {
          expect(error.status).toBe(500);
        }
      );

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/medications`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle HTTP 404 error for getById', () => {
      service.getById(999).subscribe(
        () => fail('should have failed with 404 error'),
        (error) => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${baseUrl}/medications/999`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle HTTP 400 error for invalid create', () => {
      service.create(mockNewMedication).subscribe(
        () => fail('should have failed with 400 error'),
        (error) => {
          expect(error.status).toBe(400);
        }
      );

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/medications`);
      req.flush('Bad request', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle HTTP 403 error for unauthorized delete', () => {
      service.delete(1).subscribe(
        () => fail('should have failed with 403 error'),
        (error) => {
          expect(error.status).toBe(403);
        }
      );

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/medications/1`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle medication with null imageUrl', () => {
      const medicationWithoutImage: MedicationModel = {
        id: 1,
        name: 'Medication without image',
        imageUrl: undefined
      };

      service.getById(1).subscribe(result => {
        expect(result.name).toBe('Medication without image');
        expect(result.imageUrl).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/medications/1`);
      req.flush(medicationWithoutImage);
    });

    it('should handle medication with special characters in name', () => {
      const specialNameMedication: MedicationModel = {
        id: 1,
        name: 'Amoxicillin/Clavulanic Acid 500mg + 125mg',
        imageUrl: 'http://example.com/special.jpg'
      };

      service.getById(1).subscribe(result => {
        expect(result.name).toBe('Amoxicillin/Clavulanic Acid 500mg + 125mg');
      });

      const req = httpMock.expectOne(`${baseUrl}/medications/1`);
      req.flush(specialNameMedication);
    });

    it('should handle large medication ID', () => {
      service.getById(999999).subscribe(result => {
        expect(result.id).toBe(999999);
      });

      const req = httpMock.expectOne(`${baseUrl}/medications/999999`);
      req.flush({ ...mockMedication, id: 999999 });
    });

    it('should handle update with partial medication data', () => {
      const partialUpdate: Partial<MedicationModel> = {
        name: 'New Name'
      };

      service.update(1, partialUpdate).subscribe(result => {
        expect(result.name).toBe('New Name');
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/medications/1`);
      expect(req.request.body).toEqual(partialUpdate);
      req.flush({ ...mockMedication, ...partialUpdate });
    });
  });

  describe('Multiple Medications Operations', () => {
    it('should handle retrieving multiple medications from pharmacy', () => {
      service.getByPharmacy(1).subscribe(result => {
        expect(result.length).toBe(3);
        expect(result[0].name).toBe('Aspirin');
        expect(result[1].name).toBe('Paracetamol');
        expect(result[2].name).toBe('Amoxicillin');
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/medications`);
      req.flush(mockMedications);
    });

    it('should process multiple medication operations sequentially', () => {
      // First request
      service.getAll().subscribe(result => {
        expect(result.length).toBe(3);
      });

      let req = httpMock.expectOne(`${baseUrl}/pharmacy/medications`);
      req.flush(mockMedications);

      // Second request
      service.getById(1).subscribe(result => {
        expect(result.id).toBe(1);
      });

      req = httpMock.expectOne(`${baseUrl}/medications/1`);
      req.flush(mockMedication);
    });
  });
});
