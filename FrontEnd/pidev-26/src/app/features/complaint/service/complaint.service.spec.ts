import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/api/api.tokens';
import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  UserRole,
} from '../model/complaint.model';
import { ComplaintService } from './complaint.service';

describe('ComplaintService', () => {
  let service: ComplaintService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ComplaintService, { provide: API_BASE_URL, useValue: 'http://api-test' }],
    });

    service = TestBed.inject(ComplaintService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads complaints for a patient and all complaints from the API', () => {
    service.getComplaintsByPatientId(12).subscribe((data) => {
      expect(data).toEqual([]);
    });
    const patientReq = httpMock.expectOne('http://api-test/Equipment/complaint/patient/12');
    expect(patientReq.request.method).toBe('GET');
    patientReq.flush([]);

    service.getAllComplaints().subscribe((data) => {
      expect(data).toEqual([]);
    });
    const allReq = httpMock.expectOne('http://api-test/Equipment/complaint');
    expect(allReq.request.method).toBe('GET');
    allReq.flush([]);
  });

  it('submits and validates complaints with the expected payloads', () => {
    const complaint = {
      patientId: 4,
      targetUserId: 9,
      targetUserRole: UserRole.ROLE_DOCTOR,
      category: ComplaintCategory.NEGLIGENCE,
      description: 'Needs review',
      priority: ComplaintPriority.HIGH,
      status: ComplaintStatus.SUBMITTED,
    };

    service.submitComplaint(complaint).subscribe((saved) => {
      expect(saved.id).toBe(33);
    });

    const submitReq = httpMock.expectOne('http://api-test/Equipment/complaint/submit');
    expect(submitReq.request.method).toBe('POST');
    submitReq.flush({ ...complaint, id: 33 });

    service.validateComplaint({ ...complaint, id: 33 }, 7).subscribe((saved) => {
      expect(saved.handledByAdminId).toBe(7);
    });

    const validateReq = httpMock.expectOne('http://api-test/Equipment/complaint/validate');
    expect(validateReq.request.method).toBe('PUT');
    expect(validateReq.request.body.handledByAdminId).toBe(7);
    validateReq.flush({ ...complaint, id: 33, handledByAdminId: 7 });
  });

  it('dismisses complaints, uploads evidence and saves whiteboard data', () => {
    const complaint = {
      id: 21,
      patientId: 4,
      targetUserId: 9,
      targetUserRole: UserRole.ROLE_CAREGIVER,
      category: ComplaintCategory.OTHER,
      description: 'Other issue',
      priority: ComplaintPriority.MEDIUM,
    } as any;

    service.dismissComplaint(complaint, 'admin-1', 'Resolved').subscribe((saved) => {
      expect(saved.resolutionDecision).toBe('Resolved');
    });
    const dismissReq = httpMock.expectOne('http://api-test/Equipment/complaint/dismiss');
    expect(dismissReq.request.method).toBe('PUT');
    expect(dismissReq.request.body.handledByAdminId).toBe('admin-1');
    expect(dismissReq.request.body.resolutionDecision).toBe('Resolved');
    dismissReq.flush({ ...complaint, handledByAdminId: 'admin-1', resolutionDecision: 'Resolved' });

    const file = new File(['evidence'], 'evidence.png', { type: 'image/png' });
    service.uploadImage(file).subscribe((url) => {
      expect(url).toBe('https://cdn.example/evidence.png');
    });
    const uploadReq = httpMock.expectOne('https://api.imgbb.com/1/upload?key=6917397c87588ed4436eac425b613c6e');
    expect(uploadReq.request.method).toBe('POST');
    uploadReq.flush({ data: { url: 'https://cdn.example/evidence.png' } });

    service.saveWhiteboardData(complaint, '{"items":[]}').subscribe((saved) => {
      expect(saved.whiteboardData).toBe('{"items":[]}');
    });
    const whiteboardReq = httpMock.expectOne('http://api-test/Equipment/complaint/whiteboard');
    expect(whiteboardReq.request.method).toBe('PUT');
    expect(whiteboardReq.request.body.whiteboardData).toBe('{"items":[]}');
    whiteboardReq.flush({ ...complaint, whiteboardData: '{"items":[]}' });
  });
});