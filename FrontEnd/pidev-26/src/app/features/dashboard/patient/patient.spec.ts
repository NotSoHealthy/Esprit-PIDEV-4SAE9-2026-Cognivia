import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Patient } from './patient';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { KeycloakService } from '../../../core/auth/keycloak.service';
import { LanguageService } from '../../../core/services/language.service';
import { RouterTestingModule } from '@angular/router/testing';

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
      imports: [Patient, HttpClientTestingModule, RouterTestingModule],
      providers: [
        provideTranslateService({ defaultLanguage: 'en' }),
        { provide: KeycloakService, useValue: keycloakServiceMock },
        { provide: LanguageService, useValue: languageServiceMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Patient);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
