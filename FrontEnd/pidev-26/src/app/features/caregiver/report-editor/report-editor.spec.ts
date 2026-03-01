import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ReportEditor } from './report-editor';
import { IMGBB_API_KEY } from '../../../core/media/imgbb.tokens';

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
