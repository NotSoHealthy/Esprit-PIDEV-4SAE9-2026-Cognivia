import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { Careteam } from './careteam';
import { CurrentUserService } from '../../../core/user/current-user.service';
import { CareteamService } from './service/careteam.service';

describe('Careteam', () => {
  let component: Careteam;
  let fixture: ComponentFixture<Careteam>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Careteam],
      providers: [
        {
          provide: CurrentUserService,
          useValue: {
            user: signal({ kind: 'patient', data: { id: 1 } }),
          },
        },
        {
          provide: CareteamService,
          useValue: {
            getPatientDoctorAssignment: () => of(null),
            getPatientById: () => of({ caregiverList: [] }),
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Careteam);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
