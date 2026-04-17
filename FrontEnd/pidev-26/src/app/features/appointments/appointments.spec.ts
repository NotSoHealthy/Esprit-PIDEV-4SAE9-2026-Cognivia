import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Appointments } from './appointments';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

// Import des modèles pour le typage strict
import { Appointment, AppointmentStatus } from '../../core/api/models/appointment.model';
import { PersonLite } from '../../core/api/models/person-lite.model';

// Import des services à mocker
import { AppointmentApiService } from '../../core/api/appointment.service';
import { PatientApiService } from '../../core/api/patient.service';
import { DoctorApiService } from '../../core/api/doctor.service';
import { CaregiverApiService } from '../../core/api/caregiver.service';
import { KeycloakService } from '../../core/auth/keycloak.service';

// Import Ng-Zorro
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';

describe('Appointments Component', () => {
  let component: Appointments;
  let fixture: ComponentFixture<Appointments>;

  // Mocks des services
  let appointmentApiSpy: jasmine.SpyObj<AppointmentApiService>;
  let patientApiSpy: jasmine.SpyObj<PatientApiService>;
  let doctorApiSpy: jasmine.SpyObj<DoctorApiService>;
  let caregiverApiSpy: jasmine.SpyObj<CaregiverApiService>;
  let keycloakSpy: jasmine.SpyObj<KeycloakService>;
  let notificationSpy: jasmine.SpyObj<NzNotificationService>;
  let modalSpy: jasmine.SpyObj<NzModalService>;

  // ✅ Mock DATA typé explicitement pour éviter l'erreur "string is not assignable to AppointmentStatus"
  const mockAppointments: Appointment[] = [
    { 
      id: 1, 
      notes: 'Checkup test', 
      status: 'PENDING' as AppointmentStatus, 
      patientId: 1, 
      doctorId: 1, 
      caregiverId: 1, 
      appointmentDate: new Date().toISOString(),
      durationMinutes: 60
    }
  ];

  const mockRefs: PersonLite[] = [
    { id: 1, firstName: 'John', lastName: 'Doe' } as any
  ];

  beforeEach(async () => {
    // Initialisation des spies
    appointmentApiSpy = jasmine.createSpyObj('AppointmentApiService', ['getAll', 'create', 'update', 'delete']);
    patientApiSpy = jasmine.createSpyObj('PatientApiService', ['getAll']);
    doctorApiSpy = jasmine.createSpyObj('DoctorApiService', ['getAll']);
    caregiverApiSpy = jasmine.createSpyObj('CaregiverApiService', ['getAll']);
    keycloakSpy = jasmine.createSpyObj('KeycloakService', ['getUserRole', 'getNumericUserId']);
    notificationSpy = jasmine.createSpyObj('NzNotificationService', ['success', 'error', 'warning', 'info']);
    modalSpy = jasmine.createSpyObj('NzModalService', ['confirm']);

    // Configuration des retours par défaut des services
    appointmentApiSpy.getAll.and.returnValue(of(mockAppointments));
    patientApiSpy.getAll.and.returnValue(of(mockRefs));
    doctorApiSpy.getAll.and.returnValue(of(mockRefs));
    caregiverApiSpy.getAll.and.returnValue(of(mockRefs));
    keycloakSpy.getUserRole.and.returnValue('ROLE_ADMIN');

    await TestBed.configureTestingModule({
      imports: [
        Appointments,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: AppointmentApiService, useValue: appointmentApiSpy },
        { provide: PatientApiService, useValue: patientApiSpy },
        { provide: DoctorApiService, useValue: doctorApiSpy },
        { provide: CaregiverApiService, useValue: caregiverApiSpy },
        { provide: KeycloakService, useValue: keycloakSpy },
        { provide: NzNotificationService, useValue: notificationSpy },
        { provide: NzModalService, useValue: modalSpy },
        { provide: NzMessageService, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Appointments);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load appointments and refs on init', fakeAsync(() => {
    fixture.detectChanges(); // Déclenche ngOnInit
    tick(); // Attend la microtask de fetch() et les observables
    fixture.detectChanges();

    expect(appointmentApiSpy.getAll).toHaveBeenCalled();
    expect(component.items.length).toBe(1);
    expect(component.patients.length).toBe(1);
  }));

  it('should filter items when searching by notes', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    
    component.filterNotes = 'Checkup';
    component.onSearch();
    expect(component.filteredItems.length).toBe(1);

    component.filterNotes = 'Unknown';
    component.onSearch();
    expect(component.filteredItems.length).toBe(0);
  }));

  it('should open create modal and initialize form', fakeAsync(() => {
    component.openCreate();
    tick();
    
    expect(component.isModalOpen).toBeTrue();
    expect(component.editingId).toBeNull();
    expect(component.form.durationMinutes).toBe(60);
  }));

  it('should call api.create when saving a new appointment', fakeAsync(() => {
    // Simuler l'ouverture et le remplissage du formulaire
    component.openCreate();
    tick();
    component.form = {
      patientId: 1,
      doctorId: 1,
      caregiverId: 1,
      appointmentDate: new Date(),
      durationMinutes: 30,
      status: 'PENDING',
      patientEmail: 'test@example.com'
    };

    appointmentApiSpy.create.and.returnValue(of(mockAppointments[0]));
    
    component.save();
    tick();

    expect(appointmentApiSpy.create).toHaveBeenCalled();
    expect(notificationSpy.success).toHaveBeenCalled();
    expect(component.isModalOpen).toBeFalse();
  }));

  it('should handle 409 conflict error with a warning message', fakeAsync(() => {
    component.editingId = null;
    component.form = { 
        patientId: 1, doctorId: 1, caregiverId: 1, 
        appointmentDate: new Date(), durationMinutes: 60, 
        patientEmail: 'patient@test.com' 
    };
    
    // Simuler une erreur 409 (conflit d'horaire)
    appointmentApiSpy.create.and.returnValue(throwError(() => ({ status: 409 })));

    component.save();
    tick();

    expect(notificationSpy.warning).toHaveBeenCalledWith('Conflict', jasmine.any(String));
    // Le modal doit rester ouvert pour que l'utilisateur puisse changer l'heure
    expect(component.isModalOpen).toBeTrue();
  }));

  it('should reset filters and refresh data', fakeAsync(() => {
    component.filterStatus = 'APPROVED' as AppointmentStatus;
    component.resetFilters();
    
    expect(component.filterStatus).toBeUndefined();
    expect(component.filterNotes).toBe('');
    expect(appointmentApiSpy.getAll).toHaveBeenCalled();
  }));

  it('should correctly detect if current user is a patient', () => {
    keycloakSpy.getUserRole.and.returnValue('ROLE_PATIENT');
    expect(component.isPatient()).toBeTrue();

    keycloakSpy.getUserRole.and.returnValue('ROLE_ADMIN');
    expect(component.isPatient()).toBeFalse();
  });
});
