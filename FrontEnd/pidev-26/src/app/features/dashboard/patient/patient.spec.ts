import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Patient } from './patient';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { KeycloakService } from '../../../core/auth/keycloak.service';
import { LanguageService } from '../../../core/services/language.service';

const keycloakServiceMock = {
  isLoggedIn: () => true,
  getUserRole: () => 'ROLE_PATIENT'
};

const languageServiceMock = {
  getLanguage: () => 'en',
  setLanguage: () => {},
  initLanguage: () => {}
};

describe('Patient', () => {
  let component: Patient;
  let fixture: ComponentFixture<Patient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Patient, HttpClientTestingModule],
      providers: [
        // provideRouter([]) → registers an empty router so navigate() is a no-op
        // and no route guards (which inject real KeycloakService) are ever called
        provideRouter([]),
        { provide: KeycloakService, useValue: keycloakServiceMock },
        { provide: LanguageService, useValue: languageServiceMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Patient);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
