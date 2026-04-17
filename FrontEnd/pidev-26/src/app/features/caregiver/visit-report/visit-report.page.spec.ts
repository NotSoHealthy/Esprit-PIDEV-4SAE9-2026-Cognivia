import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { API_BASE_URL } from '../../../core/api/api.tokens';
import { CurrentUserService } from '../../../core/user/current-user.service';
import { IMGBB_API_KEY } from '../../../core/media/imgbb.tokens';
import { VisitReportPage } from './visit-report.page';

describe('VisitReportPage', () => {
  let component: VisitReportPage;
  let fixture: ComponentFixture<VisitReportPage>;
  let httpMock: HttpTestingController;
  const currentUser = signal({ kind: 'caregiver' as const, data: { id: 7 } });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitReportPage],
      providers: [
        provideRouter([]),
        provideHttpClientTesting(),
        { provide: CurrentUserService, useValue: { user: currentUser } },
        { provide: API_BASE_URL, useValue: 'http://localhost' },
        { provide: IMGBB_API_KEY, useValue: 'test-imgbb-key' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitReportPage);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes visit state through its computed helpers', () => {
    component.visit = {
      id: 1,
      status: 'scheduled',
      scheduledAt: new Date(),
      patient: { firstName: 'Nour', lastName: 'Ali', severity: 'high' },
    };
    component.visitReport = { status: 'DRAFT' };

    expect(component.isDoctorViewer).toBeFalse();
    expect(component.canViewReport).toBeTrue();
    expect(component.canEdit).toBeTrue();
    expect(component.patientNameForHeader).toBe('Nour Ali');
    expect(component.patientSeverityColor).toBeTruthy();
  });

  it('saves a draft report with the visit id in the payload', () => {
    component.visitId = '42';
    component.visit = {
      id: 42,
      status: 'scheduled',
      scheduledAt: new Date(),
      patient: { id: 15, firstName: 'Nour', lastName: 'Ali' },
    };
    component.visitReport = null;
    component.reportContent = '<p>Draft content</p>';

    component.save();

    const req = httpMock.expectOne('http://localhost/monitoring/visitreport');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      content: '<p>Draft content</p>',
      status: 'DRAFT',
      visitId: '42',
    });
    req.flush({ id: 9, status: 'DRAFT', content: '<p>Draft content</p>' });

    expect(component.visitReport?.id).toBe(9);
    expect(component.isSaving).toBeFalse();
  });

  it('submits a completed visit report as validated', () => {
    component.visitId = '42';
    component.visit = {
      id: 42,
      status: 'completed',
      scheduledAt: new Date(),
      patient: { id: 15, firstName: 'Nour', lastName: 'Ali' },
    };
    component.visitReport = { status: 'DRAFT' };
    component.reportContent = '<p>Final report</p>';

    component.submit();

    const req = httpMock.expectOne('http://localhost/monitoring/visitreport');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.status).toBe('VALIDATED');
    req.flush({ id: 9, status: 'VALIDATED', content: '<p>Final report</p>' });

    expect(component.visitReport?.status).toBe('VALIDATED');
    expect(component.isSubmitting).toBeFalse();
  });

  it('blocks submission until the visit is completed', () => {
    component.visitId = '42';
    component.visit = {
      id: 42,
      status: 'scheduled',
      scheduledAt: new Date(),
      patient: { id: 15, firstName: 'Nour', lastName: 'Ali' },
    };
    component.visitReport = { status: 'DRAFT' };

    component.submit();

    expect(component.saveErrorMessage).toBe('You must complete the visit before submitting the report.');
    httpMock.expectNone('http://localhost/monitoring/visitreport');
  });
});
