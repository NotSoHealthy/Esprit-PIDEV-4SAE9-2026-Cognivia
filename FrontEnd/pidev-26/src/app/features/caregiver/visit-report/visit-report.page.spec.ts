import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../core/api/api.tokens';
import { IMGBB_API_KEY } from '../../../core/media/imgbb.tokens';
import { VisitReportPage } from './visit-report.page';

describe('VisitReportPage', () => {
  let component: VisitReportPage;
  let fixture: ComponentFixture<VisitReportPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitReportPage],
      providers: [
        provideRouter([]),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost' },
        { provide: IMGBB_API_KEY, useValue: 'test-imgbb-key' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitReportPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
