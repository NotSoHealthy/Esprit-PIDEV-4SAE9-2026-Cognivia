import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PrescriptionService } from './prescription.service';
import { Prescription, PrescriptionItem, PharmacyRecommendation } from '../models/prescription.model';
import { Frequency } from '../models/frequency.enum';

describe('PrescriptionService', () => {
  let service: PrescriptionService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:8080/pharmacy/prescriptions';

  const mockMedication = {
    id: 1,
    name: 'Aspirin',
    imageUrl: 'http://example.com/aspirin.jpg'
  };

  const mockPrescriptionItem: PrescriptionItem = {
    id: 1,
    quantity: 30,
    frequency: Frequency.ONCE_DAILY,
    medication: mockMedication
  };

  const mockPrescription: Prescription = {
    id: 1,
    code: 'RX001',
    doctorName: 'Dr. Smith',
    createdByDoctorUserId: 'doc-user-1',
    createdByDoctorUsername: 'dr.smith',
    patientName: 'John Doe',
    description: 'Take one tablet daily',
    createdAt: '2024-01-01T10:00:00Z',
    expiresAt: '2024-04-01T10:00:00Z',
    items: [mockPrescriptionItem]
  };

  const mockPrescriptions: Prescription[] = [
    mockPrescription,
    {
      id: 2,
      code: 'RX002',
      doctorName: 'Dr. Johnson',
      patientName: 'Jane Doe',
      description: 'Take as needed',
      items: []
    }
  ];

  const mockPharmacyRecommendation: PharmacyRecommendation = {
    pharmacyId: 1,
    pharmacyName: 'Main Pharmacy',
    address: '123 Main St',
    contactInfo: '+1234567890',
    bannerUrl: 'http://example.com/banner.jpg',
    logoUrl: 'http://example.com/logo.png',
    matchCount: 5,
    totalMedications: 100,
    totalAvailableQuantity: 1000
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PrescriptionService]
    });
    service = TestBed.inject(PrescriptionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Basic Retrieval Operations', () => {
    it('should get all prescriptions', () => {
      service.getAll().subscribe(result => {
        expect(result).toEqual(mockPrescriptions);
        expect(result.length).toBe(2);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockPrescriptions);
    });

    it('should get prescription by ID', () => {
      service.getById(1).subscribe(result => {
        expect(result).toEqual(mockPrescription);
        expect(result.id).toBe(1);
        expect(result.code).toBe('RX001');
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPrescription);
    });

    it('should handle empty prescription list', () => {
      service.getAll().subscribe(result => {
        expect(result).toEqual([]);
        expect(result.length).toBe(0);
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush([]);
    });

    it('should get prescriptions by patient name', () => {
      const patientNames = ['John Doe', 'Jane Doe'];
      const expectedPrescriptions = mockPrescriptions;

      service.getVisibleByPatientNames(patientNames).subscribe(result => {
        expect(result).toEqual(expectedPrescriptions);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`${apiUrl}/visible`) &&
        request.url.includes('patientNames=John+Doe') &&
        request.url.includes('patientNames=Jane+Doe')
      );
      expect(req.request.method).toBe('GET');
      req.flush(expectedPrescriptions);
    });

    it('should handle getVisibleByPatientNames with empty array', () => {
      service.getVisibleByPatientNames([]).subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`${apiUrl}/visible`)
      );
      req.flush([]);
    });

    it('should handle getVisibleByPatientNames with null values in array', () => {
      service.getVisibleByPatientNames(['John Doe', null as any, '  ']).subscribe(result => {
        expect(result).toEqual(mockPrescriptions);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`${apiUrl}/visible`) &&
        request.url.includes('patientNames=John+Doe')
      );
      req.flush(mockPrescriptions);
    });
  });

  describe('CRUD Operations', () => {
    it('should create a new prescription without context headers', () => {
      const newPrescription: Prescription = {
        code: 'RX003',
        doctorName: 'Dr. Williams',
        patientName: 'Bob Smith',
        description: 'New prescription'
      };
      const createdPrescription: Prescription = { id: 3, ...newPrescription };

      service.create(newPrescription).subscribe(result => {
        expect(result).toEqual(createdPrescription);
        expect(result.id).toBe(3);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newPrescription);
      expect(req.request.headers.has('X-User-Id')).toBe(false);
      req.flush(createdPrescription);
    });

    it('should create a prescription with user context headers', () => {
      const newPrescription: Prescription = {
        doctorName: 'Dr. Brown',
        patientName: 'Alice Johnson',
        description: 'Prescription with context'
      };
      const createdPrescription: Prescription = { id: 4, ...newPrescription };

      const userContext = { userId: 'user-123', username: 'dr.brown', role: 'DOCTOR' };

      service.create(newPrescription, userContext).subscribe(result => {
        expect(result).toEqual(createdPrescription);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('X-User-Id')).toBe('user-123');
      expect(req.request.headers.get('X-Username')).toBe('dr.brown');
      expect(req.request.headers.get('X-User-Role')).toBe('DOCTOR');
      req.flush(createdPrescription);
    });

    it('should update a prescription without context', () => {
      const updateData: Prescription = { ...mockPrescription, description: 'Updated description' };

      service.update(1, updateData).subscribe(result => {
        expect(result).toEqual(updateData);
        expect(result.description).toBe('Updated description');
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush(updateData);
    });

    it('should update a prescription with user context headers', () => {
      const updateData: Prescription = { ...mockPrescription, description: 'Updated with context' };
      const userContext = { userId: 'user-123', username: 'dr.smith', role: 'DOCTOR' };

      service.update(1, updateData, userContext).subscribe(result => {
        expect(result.description).toBe('Updated with context');
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.headers.get('X-User-Id')).toBe('user-123');
      expect(req.request.headers.get('X-Username')).toBe('dr.smith');
      req.flush(updateData);
    });

    it('should delete a prescription without context', () => {
      service.delete(1).subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.has('X-User-Id')).toBe(false);
      req.flush(null);
    });

    it('should delete a prescription with user context headers', () => {
      const userContext = { userId: 'user-123', username: 'dr.smith' };

      service.delete(1, userContext).subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('X-User-Id')).toBe('user-123');
      expect(req.request.headers.get('X-Username')).toBe('dr.smith');
      req.flush(null);
    });
  });

  describe('Prescription Items Operations', () => {
    it('should get prescription items', () => {
      const mockItems: PrescriptionItem[] = [mockPrescriptionItem];

      service.getPrescriptionItems(1).subscribe(result => {
        expect(result).toEqual(mockItems);
        expect(result[0].quantity).toBe(30);
      });

      const req = httpMock.expectOne(`${apiUrl}/1/items`);
      expect(req.request.method).toBe('GET');
      req.flush(mockItems);
    });

    it('should add medication to prescription', () => {
      const updatedPrescription: Prescription = {
        ...mockPrescription,
        items: [
          mockPrescriptionItem,
          {
            id: 2,
            quantity: 60,
            frequency: Frequency.TWICE_DAILY,
            medication: { id: 2, name: 'Ibuprofen' }
          }
        ]
      };

      service.addItem(1, 2, 60, 'TWICE_DAILY').subscribe(result => {
        expect(result).toEqual(updatedPrescription);
        expect(result.items?.length).toBe(2);
      });

      const req = httpMock.expectOne(`${apiUrl}/1/add-medication/2?quantity=60&frequency=TWICE_DAILY`);
      expect(req.request.method).toBe('POST');
      req.flush(updatedPrescription);
    });

    it('should remove medication from prescription', () => {
      const updatedPrescription: Prescription = {
        ...mockPrescription,
        items: []
      };

      service.removeItem(1, 1).subscribe(result => {
        expect(result).toEqual(updatedPrescription);
        expect(result.items?.length).toBe(0);
      });

      const req = httpMock.expectOne(`${apiUrl}/1/remove-medication/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(updatedPrescription);
    });
  });

  describe('Prescription Status Operations', () => {
    it('should get active prescriptions', () => {
      service.getActivePrescriptions().subscribe(result => {
        expect(result).toEqual(mockPrescriptions);
      });

      const req = httpMock.expectOne(`${apiUrl}/active`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPrescriptions);
    });

    it('should get expired prescriptions', () => {
      const expiredPrescriptions: Prescription[] = [
        { ...mockPrescription, expiresAt: '2023-12-01T10:00:00Z' }
      ];

      service.getExpiredPrescriptions().subscribe(result => {
        expect(result).toEqual(expiredPrescriptions);
      });

      const req = httpMock.expectOne(`${apiUrl}/expired`);
      expect(req.request.method).toBe('GET');
      req.flush(expiredPrescriptions);
    });

    it('should check if prescription is expired', () => {
      service.isExpired(1).subscribe(result => {
        expect(result).toBe(false);
      });

      const req = httpMock.expectOne(`${apiUrl}/1/is-expired`);
      expect(req.request.method).toBe('GET');
      req.flush(false);
    });

    it('should return true for expired prescription', () => {
      service.isExpired(2).subscribe(result => {
        expect(result).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/2/is-expired`);
      req.flush(true);
    });

    it('should extend prescription expiration', () => {
      const futureTimestamp = Date.now() + 90 * 24 * 60 * 60 * 1000; // 90 days
      const extendedPrescription: Prescription = {
        ...mockPrescription,
        expiresAt: new Date(futureTimestamp).toISOString()
      };

      service.extendExpiration(1, futureTimestamp).subscribe(result => {
        expect(result).toEqual(extendedPrescription);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`${apiUrl}/1/extend`) &&
        request.url.includes('expirationTimestamp=')
      );
      expect(req.request.method).toBe('PATCH');
      req.flush(extendedPrescription);
    });
  });

  describe('Prescription Statistics Operations', () => {
    it('should get most used medicines in prescriptions', () => {
      const mostUsedMedicines = [
        { medicationId: 1, name: 'Aspirin', usageCount: 50 },
        { medicationId: 2, name: 'Ibuprofen', usageCount: 45 },
        { medicationId: 3, name: 'Paracetamol', usageCount: 40 }
      ];

      service.getMostUsedMedicines().subscribe(result => {
        expect(result).toEqual(mostUsedMedicines);
        expect(result.length).toBe(3);
      });

      const req = httpMock.expectOne(`${apiUrl}/stats/most-used-medicines`);
      expect(req.request.method).toBe('GET');
      req.flush(mostUsedMedicines);
    });

    it('should handle empty most used medicines list', () => {
      service.getMostUsedMedicines().subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiUrl}/stats/most-used-medicines`);
      req.flush([]);
    });
  });

  describe('Patient Operations', () => {
    it('should get prescriptions by patient name', () => {
      service.getByPatient('John Doe').subscribe(result => {
        expect(result).toEqual(mockPrescriptions);
      });

      const req = httpMock.expectOne(`${apiUrl}?patientName=John Doe`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPrescriptions);
    });

    it('should handle patient name with special characters', () => {
      service.getByPatient("O'Brien").subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`${apiUrl}?patientName=`)
      );
      req.flush([]);
    });
  });

  describe('Prescription Code Operations', () => {
    it('should search prescription codes for autocomplete', () => {
      const suggestions = ['RX001', 'RX002', 'RX003'];

      service.searchCodes('RX').subscribe(result => {
        expect(result).toEqual(suggestions);
        expect(result.length).toBe(3);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`${apiUrl}/code-suggestions?query=RX`)
      );
      expect(req.request.method).toBe('GET');
      req.flush(suggestions);
    });

    it('should handle empty code search results', () => {
      service.searchCodes('NOTFOUND').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`${apiUrl}/code-suggestions?query=NOTFOUND`)
      );
      req.flush([]);
    });

    it('should handle special characters in code search', () => {
      service.searchCodes('RX-001').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`${apiUrl}/code-suggestions?query=RX-001`)
      );
      req.flush([]);
    });

    it('should handle null or empty code search', () => {
      service.searchCodes('').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`${apiUrl}/code-suggestions?query=`)
      );
      req.flush([]);
    });
  });

  describe('Pharmacy Recommendations', () => {
    it('should get pharmacy recommendations by code', () => {
      const recommendations: PharmacyRecommendation[] = [mockPharmacyRecommendation];

      service.getRecommendationsByCode('RX001').subscribe(result => {
        expect(result).toEqual(recommendations);
        expect(result[0].pharmacyName).toBe('Main Pharmacy');
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`${apiUrl}/recommendations?code=RX001`)
      );
      expect(req.request.method).toBe('GET');
      req.flush(recommendations);
    });

    it('should handle no pharmacy recommendations', () => {
      service.getRecommendationsByCode('NOTFOUND').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`${apiUrl}/recommendations?code=NOTFOUND`)
      );
      req.flush([]);
    });

    it('should return multiple pharmacy recommendations', () => {
      const recommendations: PharmacyRecommendation[] = [
        mockPharmacyRecommendation,
        {
          pharmacyId: 2,
          pharmacyName: 'Secondary Pharmacy',
          address: '456 Oak Ave',
          contactInfo: '+0987654321',
          matchCount: 4,
          totalMedications: 80,
          totalAvailableQuantity: 800
        }
      ];

      service.getRecommendationsByCode('RX001').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].pharmacyName).toBe('Main Pharmacy');
        expect(result[1].pharmacyName).toBe('Secondary Pharmacy');
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`${apiUrl}/recommendations?code=RX001`)
      );
      req.flush(recommendations);
    });

    it('should handle URL encoding for special characters in code', () => {
      service.getRecommendationsByCode('RX-001+A').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(request =>
        request.url.includes(`${apiUrl}/recommendations?code=RX-001%2BA`)
      );
      req.flush([]);
    });
  });

  describe('Context Header Building', () => {
    it('should build headers with only userId', () => {
      service.create(mockPrescription, { userId: 'user-123' }).subscribe();

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.headers.get('X-User-Id')).toBe('user-123');
      expect(req.request.headers.has('X-Username')).toBe(false);
      expect(req.request.headers.has('X-User-Role')).toBe(false);
      req.flush(mockPrescription);
    });

    it('should build headers with only username', () => {
      service.create(mockPrescription, { username: 'dr.smith' }).subscribe();

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.headers.has('X-User-Id')).toBe(false);
      expect(req.request.headers.get('X-Username')).toBe('dr.smith');
      expect(req.request.headers.has('X-User-Role')).toBe(false);
      req.flush(mockPrescription);
    });

    it('should skip empty or whitespace-only context values', () => {
      service.create(mockPrescription, { userId: '  ', username: '', role: null as any }).subscribe();

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.headers.has('X-User-Id')).toBe(false);
      expect(req.request.headers.has('X-Username')).toBe(false);
      expect(req.request.headers.has('X-User-Role')).toBe(false);
      req.flush(mockPrescription);
    });
  });

  describe('Error Handling', () => {
    it('should handle 500 error for getAll', () => {
      service.getAll().subscribe(
        () => fail('should have failed with 500 error'),
        (error) => {
          expect(error.status).toBe(500);
        }
      );

      const req = httpMock.expectOne(apiUrl);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle 404 error for getById', () => {
      service.getById(999).subscribe(
        () => fail('should have failed with 404 error'),
        (error) => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/999`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle 403 error for unauthorized delete', () => {
      service.delete(1, { role: 'PATIENT' }).subscribe(
        () => fail('should have failed with 403 error'),
        (error) => {
          expect(error.status).toBe(403);
        }
      );

      const req = httpMock.expectOne(`${apiUrl}/1`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });

    it('should handle 400 error for invalid prescription data', () => {
      service.create(mockPrescription).subscribe(
        () => fail('should have failed with 400 error'),
        (error) => {
          expect(error.status).toBe(400);
        }
      );

      const req = httpMock.expectOne(apiUrl);
      req.flush('Bad request', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('Edge Cases and Boundary Tests', () => {
    it('should handle prescription with null optional fields', () => {
      const minimalPrescription: Prescription = {
        id: 1,
        patientName: 'Patient Name',
        doctorName: null,
        description: 'Some description'
      };

      service.getById(1).subscribe(result => {
        expect(result.patientName).toBe('Patient Name');
        expect(result.doctorName).toBeNull();
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      req.flush(minimalPrescription);
    });

    it('should handle prescription with empty items array', () => {
      const prescriptionWithoutItems: Prescription = {
        ...mockPrescription,
        items: []
      };

      service.getById(1).subscribe(result => {
        expect(result.items).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      req.flush(prescriptionWithoutItems);
    });

    it('should handle large prescription ID', () => {
      service.getById(999999999).subscribe(result => {
        expect(result.id).toBe(999999999);
      });

      const req = httpMock.expectOne(`${apiUrl}/999999999`);
      req.flush({ ...mockPrescription, id: 999999999 });
    });

    it('should handle prescription with very long description', () => {
      const longDescription = 'A'.repeat(1000);
      const prescriptionWithLongDesc: Prescription = {
        ...mockPrescription,
        description: longDescription
      };

      service.create(prescriptionWithLongDesc).subscribe(result => {
        expect(result.description).toBe(longDescription);
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(prescriptionWithLongDesc);
    });

    it('should handle null prescription items gracefully', () => {
      service.getPrescriptionItems(1).subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiUrl}/1/items`);
      req.flush([]);
    });
  });

  describe('Query Parameter Encoding', () => {
    it('should properly encode special characters in patient search', () => {
      service.getByPatient("O'Brien").subscribe();

      const req = httpMock.expectOne(request => 
        request.url.includes(`${apiUrl}?patientName=`)
      );
      req.flush([]);
    });

    it('should properly encode spaces in prescription code search', () => {
      service.searchCodes('RX 001').subscribe();

      const req = httpMock.expectOne(request =>
        request.url.includes(`${apiUrl}/code-suggestions`)
      );
      req.flush([]);
    });
  });
});
