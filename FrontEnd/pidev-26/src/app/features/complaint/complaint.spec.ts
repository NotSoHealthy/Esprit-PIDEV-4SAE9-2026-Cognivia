import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Router } from '@angular/router';

import { Complaint } from './complaint';
import { CurrentUserService } from '../../core/user/current-user.service';
import { ComplaintService } from './service/complaint.service';

describe('Complaint', () => {
  let component: Complaint;
  let fixture: ComponentFixture<Complaint>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Complaint],
      providers: [
        {
          provide: CurrentUserService,
          useValue: {
            user: signal({ kind: 'patient', data: { id: 1 } }),
          },
        },
        {
          provide: ComplaintService,
          useValue: {
            getComplaintsByPatientId: () => of([]),
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: () => Promise.resolve(true),
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Complaint);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
