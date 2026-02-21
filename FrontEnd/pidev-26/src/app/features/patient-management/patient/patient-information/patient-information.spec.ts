import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../../core/api/api.tokens';

import { PatientInformation } from './patient-information';

describe('PatientInformation', () => {
  let component: PatientInformation;
  let fixture: ComponentFixture<PatientInformation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientInformation],
      providers: [
        provideHttpClientTesting(),
        {
          provide: API_BASE_URL,
          useValue: 'http://localhost',
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientInformation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
