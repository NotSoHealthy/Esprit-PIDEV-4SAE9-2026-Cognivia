import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

import { Complaint } from './complaint';
import { API_BASE_URL } from '../../core/api/api.tokens';
import { TranslateService } from '@ngx-translate/core';
import { CurrentUserService } from '../../core/user/current-user.service';
import { ComplaintService } from './service/complaint.service';
import { KeycloakService } from '../../core/auth/keycloak.service';
import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  UserRole,
} from './model/complaint.model';

describe('Complaint', () => {
  let component: Complaint;
  let fixture: ComponentFixture<Complaint>;
  let complaintService: jasmine.SpyObj<ComplaintService>;
  let keycloakService: jasmine.SpyObj<KeycloakService>;
  const currentUser = signal({ kind: 'patient' as const, data: { id: 1 } });

  beforeEach(async () => {
    complaintService = jasmine.createSpyObj<ComplaintService>('ComplaintService', [
      'getComplaintsByPatientId',
      'getAllComplaints',
      'deleteComplaint',
      'getPatientDetails',
      'getDoctorDetails',
      'getCaregiverDetails',
      'validateComplaint',
      'dismissComplaint',
      'startInvestigation',
      'takeAction',
      'appealComplaint',
      'closeComplaint',
    ]);
    keycloakService = jasmine.createSpyObj<KeycloakService>('KeycloakService', [
      'getRealmRoles',
      'getNumericUserId',
      'getUserId',
    ]);
    keycloakService.getRealmRoles.and.returnValue([]);
    keycloakService.getNumericUserId.and.returnValue(1);
    keycloakService.getUserId.and.returnValue('1');
    complaintService.getComplaintsByPatientId.and.returnValue(of([]));
    complaintService.getAllComplaints.and.returnValue(of([]));
    complaintService.deleteComplaint.and.returnValue(of(void 0));
    complaintService.getPatientDetails.and.returnValue(of({ firstName: 'Pat', lastName: 'Smith' }));
    complaintService.getDoctorDetails.and.returnValue(of({ firstName: 'Doc', lastName: 'Jones' }));
    complaintService.getCaregiverDetails.and.returnValue(of({ firstName: 'Care', lastName: 'Giver' }));

    await TestBed.configureTestingModule({
      imports: [Complaint],
      providers: [
        provideRouter([]),
        {
          provide: CurrentUserService,
          useValue: {
            user: currentUser,
          },
        },
        {
          provide: ComplaintService,
          useValue: complaintService,
        },
        { provide: KeycloakService, useValue: keycloakService },
        {
          provide: API_BASE_URL,
          useValue: 'http://api-test'
        },
        {
          provide: TranslateService,
          useValue: jasmine.createSpyObj('TranslateService', ['get', 'use'])
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Complaint);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads complaints for the current patient on init', () => {
    complaintService.getComplaintsByPatientId.and.returnValue(
      of([
        {
          id: 1,
          patientId: 1,
          targetUserId: 9,
          targetUserRole: UserRole.ROLE_DOCTOR,
          category: ComplaintCategory.NEGLIGENCE,
          description: 'One',
          priority: ComplaintPriority.HIGH,
          status: ComplaintStatus.SUBMITTED,
        },
      ]),
    );

    component.ngOnInit();

    expect(complaintService.getComplaintsByPatientId).toHaveBeenCalledWith(1);
    expect(component.loading()).toBeFalse();
    expect(component.complaints().length).toBe(1);
  });

  it('filters and sorts complaints by category, priority and date', () => {
    component.complaints.set([
      {
        id: 1,
        patientId: 1,
        targetUserId: 9,
        targetUserRole: UserRole.ROLE_DOCTOR,
        category: ComplaintCategory.NEGLIGENCE,
        description: 'B',
        priority: ComplaintPriority.MEDIUM,
        status: ComplaintStatus.SUBMITTED,
        createdAt: '2026-04-01T10:00:00Z',
      },
      {
        id: 2,
        patientId: 1,
        targetUserId: 9,
        targetUserRole: UserRole.ROLE_DOCTOR,
        category: ComplaintCategory.OTHER,
        description: 'A',
        priority: ComplaintPriority.URGENT,
        status: ComplaintStatus.SUBMITTED,
        createdAt: '2026-04-02T10:00:00Z',
      },
    ]);

    component.setCategoryFilter(ComplaintCategory.NEGLIGENCE);
    component.setSortBy('date');

    expect(component.sortedComplaints().map((complaint) => complaint.id)).toEqual([1]);
    expect(component.getCategoryLabel(ComplaintCategory.DELAY_IN_SERVICE)).toBe('Delay in Service');
    expect(component.getPriorityLabel(ComplaintPriority.URGENT)).toBe('Urgent');
  });

  it('opens the detail overlay and loads related names for admins', () => {
    keycloakService.getRealmRoles.and.returnValue(['ROLE_ADMIN']);
    component.ngOnInit();

    const complaint = {
      id: 5,
      patientId: 1,
      targetUserId: 11,
      targetUserRole: UserRole.ROLE_DOCTOR,
      category: ComplaintCategory.PROFESSIONAL_MISCONDUCT,
      description: 'Detail',
      priority: ComplaintPriority.LOW,
      status: ComplaintStatus.SUBMITTED,
    };

    component.openDetailOverlay(complaint);

    expect(component.showDetailOverlay()).toBeTrue();
    expect(component.detailSubmitterName()).toBe('Pat Smith');
    expect(component.detailTargetName()).toBe('Doc Jones');
    expect(component.detailLoading()).toBeFalse();
  });

  it('confirms retracting a complaint and removes it after deletion', () => {
    component.complaints.set([
      {
        id: 1,
        patientId: 1,
        targetUserId: 9,
        targetUserRole: UserRole.ROLE_DOCTOR,
        category: ComplaintCategory.NEGLIGENCE,
        description: 'One',
        priority: ComplaintPriority.HIGH,
        status: ComplaintStatus.SUBMITTED,
      },
    ]);

    component.retractComplaint(1);
    expect(component.showRetractConfirmation()).toBeTrue();
    expect(component.complaintNameToDelete()).toBe('Negligence');

    component.confirmRetract();

    expect(complaintService.deleteComplaint).toHaveBeenCalledWith(1);
    expect(component.showRetractConfirmation()).toBeFalse();
    expect(component.complaints().length).toBe(0);
  });
});
