import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/api/api.tokens';

import { Patient } from './patient';

describe('Patient', () => {
  let component: Patient;
  let fixture: ComponentFixture<Patient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Patient],
      providers: [
        provideHttpClientTesting(),
        {
          provide: API_BASE_URL,
          useValue: 'http://localhost',
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Patient);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
