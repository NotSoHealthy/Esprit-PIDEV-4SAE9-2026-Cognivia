import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../../core/api/api.tokens';
import { CareteamService } from './careteam.service';

describe('CareteamService', () => {
  let service: CareteamService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CareteamService, { provide: API_BASE_URL, useValue: 'http://api-test' }],
    });

    service = TestBed.inject(CareteamService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('returns the patient-doctor assignment when available', () => {
    service.getPatientDoctorAssignment(8).subscribe((assignment) => {
      expect(assignment?.doctor?.firstName).toBe('Ava');
    });

    const req = httpMock.expectOne('http://api-test/care/patientdoctorassignment/patient/8');
    expect(req.request.method).toBe('GET');
    req.flush({ doctor: { firstName: 'Ava', lastName: 'Stone' } });
  });

  it('falls back to null for missing assignments', () => {
    service.getPatientDoctorAssignment(8).subscribe((assignment) => {
      expect(assignment).toBeNull();
    });

    const req = httpMock.expectOne('http://api-test/care/patientdoctorassignment/patient/8');
    req.flush('Not found', { status: 404, statusText: 'Not Found' });
  });

  it('returns a safe empty patient object when the patient is missing', () => {
    service.getPatientById(15).subscribe((patient) => {
      expect(patient).toEqual({ id: 15, userId: '', firstName: '', lastName: '', caregiverList: [] });
    });

    const req = httpMock.expectOne('http://api-test/care/patient/15');
    req.flush('Not found', { status: 404, statusText: 'Not Found' });
  });
});