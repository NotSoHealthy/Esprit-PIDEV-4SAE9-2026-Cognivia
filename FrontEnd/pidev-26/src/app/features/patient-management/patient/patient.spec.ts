import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { convertToParamMap } from '@angular/router';
import { API_BASE_URL } from '../../../core/api/api.tokens';
import { of } from 'rxjs';

import { Patient } from './patient';

describe('Patient', () => {
  let component: Patient;
  let fixture: ComponentFixture<Patient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Patient],
      providers: [
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: API_BASE_URL,
          useValue: 'http://localhost',
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: '1' }),
            },
            paramMap: of(convertToParamMap({ id: '1' })),
            queryParamMap: of(convertToParamMap({ tab: 'information' })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Patient);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('reads active tab from query param', async () => {
    const route = TestBed.inject(ActivatedRoute) as any;
    route.queryParamMap = of(convertToParamMap({ tab: 'visits' }));

    const freshFixture = TestBed.createComponent(Patient);
    const freshComponent = freshFixture.componentInstance;
    freshFixture.detectChanges();
    await freshFixture.whenStable();

    expect(freshComponent.activePanel).toBe('visits');
  });
});
