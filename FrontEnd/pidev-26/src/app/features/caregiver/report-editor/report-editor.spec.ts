import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportEditor } from './report-editor';
import { IMGBB_API_KEY } from '../../../core/media/imgbb.tokens';
import { GEMINI_API_KEY, GEMINI_MODEL } from '../../../core/ai/gemini.tokens';
import { of } from 'rxjs';
import { GeminiService } from '../../../core/ai/gemini.service';
import { ImgbbImageService } from '../../../core/media/imgbb-image.service';
import { Overlay } from '@angular/cdk/overlay';

describe('ReportEditor', () => {
  let component: ReportEditor;
  let fixture: ComponentFixture<ReportEditor>;
  let geminiService: jasmine.SpyObj<GeminiService>;
  let imgbbImageService: jasmine.SpyObj<ImgbbImageService>;

  beforeEach(async () => {
    geminiService = jasmine.createSpyObj<GeminiService>('GeminiService', ['generateText']);
    imgbbImageService = jasmine.createSpyObj<ImgbbImageService>('ImgbbImageService', [
      'uploadImage',
    ]);
    geminiService.generateText.and.resolveTo('');
    imgbbImageService.uploadImage.and.returnValue(of('https://cdn.example/image.png'));

    await TestBed.configureTestingModule({
      imports: [ReportEditor],
      providers: [
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
        { provide: GeminiService, useValue: geminiService },
        { provide: ImgbbImageService, useValue: imgbbImageService },
        { provide: Overlay, useValue: { create: jasmine.createSpy('create') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportEditor);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('generates a draft from caregiver notes and accepts it into the editor content', async () => {
    geminiService.generateText.and.resolveTo('Line one\n\nLine two');
    component.reportContent = 'Initial notes';

    await component.generateDraft();

    expect(geminiService.generateText).toHaveBeenCalled();
    expect(component.aiDraft).toBe('<p>Line one</p><p>Line two</p>');

    const emitSpy = spyOn(component.contentChange, 'emit');
    component.acceptDraft();

    expect(component.reportContent).toBe('<p>Line one</p><p>Line two</p>');
    expect(component.aiDraft).toBeNull();
    expect(emitSpy).toHaveBeenCalledWith('<p>Line one</p><p>Line two</p>');
  });

  it('reports an error when asking for a draft without notes', async () => {
    component.reportContent = '';

    await component.generateDraft();

    expect(geminiService.generateText).not.toHaveBeenCalled();
    expect(component.aiErrorMessage).toBe('Write a few notes first, then generate a draft.');
  });

  it('ignores content changes when read only', () => {
    component.readOnly = true;
    const emitSpy = spyOn(component.contentChange, 'emit');

    component.onReportContentChange('<p>Blocked</p>');

    expect(component.reportContent).toBe('');
    expect(emitSpy).not.toHaveBeenCalled();
  });
});
