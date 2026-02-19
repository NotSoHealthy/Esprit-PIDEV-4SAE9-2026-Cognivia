import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientInformation } from './patient-information';

describe('PatientInformation', () => {
  let component: PatientInformation;
  let fixture: ComponentFixture<PatientInformation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientInformation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientInformation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
