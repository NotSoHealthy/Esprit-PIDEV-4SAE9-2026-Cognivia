import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Doctor } from './doctor';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/api/api.tokens';
import { KeycloakService } from '../../../core/auth/keycloak.service';
import { LanguageService } from '../../../core/services/language.service';
import { provideTranslateService } from '@ngx-translate/core';

const keycloakServiceMock = {
  isLoggedIn: () => true,
  getUserRole: () => 'ROLE_DOCTOR'
};

const languageServiceMock = {
  getLanguage: () => 'en',
  setLanguage: () => {},
  initLanguage: () => {}
};

describe('Doctor', () => {
  let component: Doctor;
  let fixture: ComponentFixture<Doctor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Doctor, HttpClientTestingModule],
      providers: [
        provideTranslateService({ defaultLanguage: 'en' }),
        { provide: API_BASE_URL, useValue: 'http://api-test' },
        { provide: KeycloakService, useValue: keycloakServiceMock },
        { provide: LanguageService, useValue: languageServiceMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Doctor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
