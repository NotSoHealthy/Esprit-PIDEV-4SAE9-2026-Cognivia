import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { VisitList } from './visit-list';
import { GEMINI_API_KEY, GEMINI_MODEL } from '../../../core/ai/gemini.tokens';
import { TranslateService } from '@ngx-translate/core';
import { API_BASE_URL } from '../../../core/api/api.tokens';
import { of } from 'rxjs';

describe('VisitList', () => {
  let component: VisitList;
  let fixture: ComponentFixture<VisitList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitList],
      providers: [
        provideRouter([]),
        provideHttpClientTesting(),
        {
          provide: API_BASE_URL,
          useValue: 'http://localhost',
        },
        {
          provide: GEMINI_API_KEY,
          useValue: 'test-gemini-key',
        },
        {
          provide: GEMINI_MODEL,
          useValue: 'gemini-1.5-flash',
        },
        {
          provide: TranslateService,
          useValue: jasmine.createSpyObj('TranslateService', ['get', 'use'])
        }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
