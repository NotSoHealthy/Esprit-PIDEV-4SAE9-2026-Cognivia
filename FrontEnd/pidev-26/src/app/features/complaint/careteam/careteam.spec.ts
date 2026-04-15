import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Careteam } from './careteam';
import { CurrentUserService } from '../../../core/user/current-user.service';
import { CareteamService } from './service/careteam.service';
import { API_BASE_URL } from '../../../core/api/api.tokens';
import { TranslateService } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';

describe('Careteam', () => {
  let component: Careteam;
  let fixture: ComponentFixture<Careteam>;
  let careteamService: jasmine.SpyObj<CareteamService>;
  const currentUser = signal({ kind: 'patient' as const, data: { id: 1 } });

  beforeEach(async () => {
    careteamService = jasmine.createSpyObj<CareteamService>('CareteamService', [
      'getPatientDoctorAssignment',
      'getPatientById',
    ]);
    careteamService.getPatientDoctorAssignment.and.returnValue(
      of({ doctor: { firstName: 'Mina', lastName: 'Saleh' } } as any),
    );
    careteamService.getPatientById.and.returnValue(
      of({ caregiverList: [{ firstName: 'Alaa', lastName: 'Nour' }] } as any),
    );

    await TestBed.configureTestingModule({
      imports: [Careteam, RouterTestingModule],
      providers: [
        {
          provide: API_BASE_URL,
          useValue: 'http://api-test'
        },
        {
          provide: TranslateService,
          useValue: jasmine.createSpyObj('TranslateService', ['get', 'use'])
        },
        {
          provide: CurrentUserService,
          useValue: {
            user: currentUser,
          },
        },
        {
          provide: CareteamService,
          useValue: careteamService,
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Careteam);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the care team for the current patient', () => {
    component.ngOnInit();

    expect(careteamService.getPatientDoctorAssignment).toHaveBeenCalledWith(1);
    expect(careteamService.getPatientById).toHaveBeenCalledWith(1);
    expect(component.getDoctorFullName()).toBe('Mina Saleh');
    expect(component.getCaregiverFullName({ firstName: 'Alaa', lastName: 'Nour' } as any)).toBe(
      'Alaa Nour',
    );
    expect(component.loading()).toBeFalse();
  });

  it('opens and closes the report modal with the selected target', () => {
    component.openReportModal(9, 'ROLE_DOCTOR' as any, 'Mina Saleh');

    expect(component.isReportModalOpen()).toBeTrue();
    expect(component.reportTargetUserId()).toBe(9);
    expect(component.reportTargetName()).toBe('Mina Saleh');

    component.closeReportModal();

    expect(component.isReportModalOpen()).toBeFalse();
  });
});
