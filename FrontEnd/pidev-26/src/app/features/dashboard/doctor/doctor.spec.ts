import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Doctor } from './doctor';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/api/api.tokens';
import { KeycloakService } from '../../../core/auth/keycloak.service';
import { RiskScoreService } from '../../../core/services/cognitive-tests/risk.service';
import { TestResultService } from '../../../core/services/cognitive-tests/result.service';
import { PatientService } from '../../../core/services/care/patient.service';
import { CognitiveTestService } from '../../../core/services/cognitive-tests/test.service';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('Doctor', () => {
  let component: Doctor;
  let fixture: ComponentFixture<Doctor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Doctor, HttpClientTestingModule, NoopAnimationsModule],
      providers: [
        { provide: API_BASE_URL, useValue: 'http://api-test' },
        { provide: KeycloakService, useValue: { isLoggedIn: () => true, getUserRole: () => 'ROLE_DOCTOR' } },
        // Stub services used in ngOnInit to prevent real HTTP calls
        { provide: RiskScoreService, useValue: { getAllRisks: () => of([]) } },
        { provide: TestResultService, useValue: { getAllResults: () => of([]), downloadReport: () => of(new Blob()) } },
        { provide: PatientService, useValue: { getAllPatients: () => of([]) } },
        { provide: CognitiveTestService, useValue: { downloadMLData: () => of(new Blob()) } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Doctor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
