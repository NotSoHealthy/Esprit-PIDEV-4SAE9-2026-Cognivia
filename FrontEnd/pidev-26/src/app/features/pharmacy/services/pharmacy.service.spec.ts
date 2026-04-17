import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PharmacyService } from './pharmacy.service';
import { API_BASE_URL } from '../../../core/api/api.tokens';
import { Pharmacy, NewPharmacy } from '../models/pharmacy.model';

describe('PharmacyService', () => {
  let service: PharmacyService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://api-gateway';

  const mockPharmacy: Pharmacy = {
    id: 1,
    name: 'Test Pharmacy',
    address: '123 Main St',
    description: 'Test Description',
    contactInfo: '+1234567890',
    latitude: 40.7128,
    longitude: -74.006,
    bannerUrl: 'http://example.com/banner.jpg',
    logoUrl: 'http://example.com/logo.png',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  };

  const mockNewPharmacy: NewPharmacy = {
    name: 'New Pharmacy',
    address: '456 Oak Ave',
    description: 'New Description',
    contactInfo: '+0987654321'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PharmacyService,
        { provide: API_BASE_URL, useValue: baseUrl }
      ]
    });
    service = TestBed.inject(PharmacyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('CRUD Operations', () => {
    it('should fetch all pharmacies', () => {
      const mockPharmacies: Pharmacy[] = [mockPharmacy];

      service.getAll().subscribe(result => {
        expect(result).toEqual(mockPharmacies);
        expect(result.length).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/pharmacies`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPharmacies);
    });

    it('should fetch pharmacy by ID', () => {
      service.getById(1).subscribe(result => {
        expect(result).toEqual(mockPharmacy);
        expect(result.id).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/pharmacies/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPharmacy);
    });

    it('should create a new pharmacy', () => {
      const newPharmacy: Pharmacy = { id: 2, ...mockNewPharmacy };

      service.create(mockNewPharmacy).subscribe(result => {
        expect(result).toEqual(newPharmacy);
        expect(result.id).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/pharmacies`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockNewPharmacy);
      req.flush(newPharmacy);
    });

    it('should update a pharmacy', () => {
      const updateData: Partial<Pharmacy> = { name: 'Updated Pharmacy' };
      const updatedPharmacy: Pharmacy = { ...mockPharmacy, ...updateData };

      service.update(1, updateData).subscribe(result => {
        expect(result).toEqual(updatedPharmacy);
        expect(result.name).toBe('Updated Pharmacy');
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/pharmacies/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush(updatedPharmacy);
    });

    it('should delete a pharmacy', () => {
      service.delete(1).subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/pharmacies/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Update Operations', () => {
    it('should update pharmacy info (name, description, contactInfo)', () => {
      const infoUpdate = {
        name: 'Updated Name',
        description: 'Updated Description',
        contactInfo: '+9876543210'
      };
      const updatedPharmacy: Pharmacy = { ...mockPharmacy, ...infoUpdate };

      service.updateInfo(1, infoUpdate).subscribe(result => {
        expect(result).toEqual(updatedPharmacy);
        expect(result.name).toBe('Updated Name');
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/pharmacies/1/update-info`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(infoUpdate);
      req.flush(updatedPharmacy);
    });

    it('should update pharmacy location', () => {
      const locationUpdate = {
        address: '789 Elm St',
        latitude: 34.0522,
        longitude: -118.2437
      };
      const updatedPharmacy: Pharmacy = { ...mockPharmacy, ...locationUpdate };

      service.updateLocation(1, locationUpdate).subscribe(result => {
        expect(result).toEqual(updatedPharmacy);
        expect(result.address).toBe('789 Elm St');
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/pharmacies/1/update-location`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(locationUpdate);
      req.flush(updatedPharmacy);
    });
  });

  describe('File Upload Operations', () => {
    it('should upload logo for a pharmacy', () => {
      const mockFile = new File(['logo content'], 'logo.png', { type: 'image/png' });
      const updatedPharmacy: Pharmacy = { ...mockPharmacy, logoUrl: 'http://example.com/new-logo.png' };

      service.uploadLogo(1, mockFile).subscribe(result => {
        expect(result).toEqual(updatedPharmacy);
        expect(result.logoUrl).toBe('http://example.com/new-logo.png');
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/pharmacies/1/upload-logo`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(updatedPharmacy);
    });

    it('should upload banner and logo images', () => {
      const mockBanner = new File(['banner content'], 'banner.png', { type: 'image/png' });
      const mockLogo = new File(['logo content'], 'logo.png', { type: 'image/png' });
      const updatedPharmacy: Pharmacy = {
        ...mockPharmacy,
        bannerUrl: 'http://example.com/new-banner.png',
        logoUrl: 'http://example.com/new-logo.png'
      };

      service.uploadImages(1, { banner: mockBanner, logo: mockLogo }).subscribe(result => {
        expect(result).toEqual(updatedPharmacy);
        expect(result.bannerUrl).toBe('http://example.com/new-banner.png');
        expect(result.logoUrl).toBe('http://example.com/new-logo.png');
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/pharmacies/1/upload-images`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(updatedPharmacy);
    });

    it('should upload only banner image', () => {
      const mockBanner = new File(['banner content'], 'banner.png', { type: 'image/png' });
      const updatedPharmacy: Pharmacy = {
        ...mockPharmacy,
        bannerUrl: 'http://example.com/new-banner.png'
      };

      service.uploadImages(1, { banner: mockBanner }).subscribe(result => {
        expect(result.bannerUrl).toBe('http://example.com/new-banner.png');
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/pharmacies/1/upload-images`);
      expect(req.request.method).toBe('POST');
      req.flush(updatedPharmacy);
    });
  });

  describe('Configuration Operations', () => {
    it('should get agent mode configuration', () => {
      const agentModeConfig = { agentModeEnabled: true };

      service.getAgentMode().subscribe(result => {
        expect(result).toEqual(agentModeConfig);
        expect(result.agentModeEnabled).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/config/agent-mode`);
      expect(req.request.method).toBe('GET');
      req.flush(agentModeConfig);
    });

    it('should update agent mode configuration', () => {
      const updatedConfig = { agentModeEnabled: true };

      service.updateAgentMode(true).subscribe(result => {
        expect(result).toEqual(updatedConfig);
        expect(result.agentModeEnabled).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/config/agent-mode`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ agentModeEnabled: true });
      req.flush(updatedConfig);
    });

    it('should disable agent mode configuration', () => {
      const disabledConfig = { agentModeEnabled: false };

      service.updateAgentMode(false).subscribe(result => {
        expect(result.agentModeEnabled).toBe(false);
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/config/agent-mode`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ agentModeEnabled: false });
      req.flush(disabledConfig);
    });

    it('should get auto delete review required configuration', () => {
      const autoDeleteConfig = { autoDeleteReviewRequired: true };

      service.getAutoDeleteReviewRequired().subscribe(result => {
        expect(result).toEqual(autoDeleteConfig);
        expect(result.autoDeleteReviewRequired).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/config/auto-delete-review-required`);
      expect(req.request.method).toBe('GET');
      req.flush(autoDeleteConfig);
    });

    it('should update auto delete review required configuration', () => {
      const updatedConfig = { autoDeleteReviewRequired: false };

      service.updateAutoDeleteReviewRequired(false).subscribe(result => {
        expect(result).toEqual(updatedConfig);
        expect(result.autoDeleteReviewRequired).toBe(false);
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/config/auto-delete-review-required`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ autoDeleteReviewRequired: false });
      req.flush(updatedConfig);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors for getAll', () => {
      service.getAll().subscribe(
        () => fail('should have failed with 500 error'),
        (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Internal Server Error');
        }
      );

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/pharmacies`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle 404 error for getById with non-existent ID', () => {
      service.getById(999).subscribe(
        () => fail('should have failed with 404 error'),
        (error) => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/pharmacies/999`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle 400 error for invalid create request', () => {
      service.create(mockNewPharmacy).subscribe(
        () => fail('should have failed with 400 error'),
        (error) => {
          expect(error.status).toBe(400);
        }
      );

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/pharmacies`);
      req.flush('Bad request', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle pharmacy with null optional fields', () => {
      const minimalPharmacy: Pharmacy = {
        id: 1,
        name: 'Minimal Pharmacy'
      };

      service.getById(1).subscribe(result => {
        expect(result.name).toBe('Minimal Pharmacy');
        expect(result.address).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/pharmacies/1`);
      req.flush(minimalPharmacy);
    });

    it('should handle empty pharmacy list', () => {
      service.getAll().subscribe(result => {
        expect(result).toEqual([]);
        expect(result.length).toBe(0);
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/pharmacies`);
      req.flush([]);
    });

    it('should handle location update with null coordinates', () => {
      const locationUpdate = {
        address: '999 Unknown',
        latitude: null,
        longitude: null
      };

      service.updateLocation(1, locationUpdate).subscribe(result => {
        expect(result.address).toBe('999 Unknown');
      });

      const req = httpMock.expectOne(`${baseUrl}/pharmacy/pharmacies/1/update-location`);
      req.flush({ ...mockPharmacy, ...locationUpdate });
    });
  });
});
