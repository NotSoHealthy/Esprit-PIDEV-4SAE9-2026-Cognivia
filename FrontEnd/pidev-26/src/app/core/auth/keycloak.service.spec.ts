import { TestBed } from '@angular/core/testing';
import { KeycloakService } from './keycloak.service';
import { LanguageService } from '../services/language.service';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

describe('KeycloakService', () => {
  let service: KeycloakService;
  let mockLanguageService: any;
  let mockTranslateService: any;

  beforeEach(() => {
    mockLanguageService = {
      getLanguage: jasmine.createSpy('getLanguage').and.returnValue('en')
    };
    mockTranslateService = jasmine.createSpyObj('TranslateService', ['get', 'use']);
    mockTranslateService.get.and.returnValue(of(''));

    TestBed.configureTestingModule({
      providers: [
        KeycloakService,
        { provide: LanguageService, useValue: mockLanguageService },
        { provide: TranslateService, useValue: mockTranslateService }
      ]
    });
    service = TestBed.inject(KeycloakService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
