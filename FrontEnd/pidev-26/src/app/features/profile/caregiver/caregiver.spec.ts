import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/api/api.tokens';

import { Caregiver } from './caregiver';

import { TranslateService } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';

describe('Caregiver', () => {
  let component: Caregiver;
  let fixture: ComponentFixture<Caregiver>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Caregiver, RouterTestingModule],
      providers: [
        provideHttpClientTesting(),
        {
          provide: API_BASE_URL,
          useValue: 'http://localhost',
        },
        {
          provide: TranslateService,
          useValue: jasmine.createSpyObj('TranslateService', ['get', 'use', 'onTranslationChange', 'onLangChange', 'onDefaultLangChange'])
        }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Caregiver);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
