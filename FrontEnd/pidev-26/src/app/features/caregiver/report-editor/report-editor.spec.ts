import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ReportEditor } from './report-editor';
import { IMGBB_API_KEY } from '../../../core/media/imgbb.tokens';
import { GEMINI_API_KEY, GEMINI_MODEL } from '../../../core/ai/gemini.tokens';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

describe('ReportEditor', () => {
  let component: ReportEditor;
  let fixture: ComponentFixture<ReportEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportEditor],
      providers: [
        provideHttpClientTesting(),
        {
          provide: IMGBB_API_KEY,
          useValue: 'test-imgbb-key',
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

    fixture = TestBed.createComponent(ReportEditor);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
