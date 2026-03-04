import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '../../../core/api/api.tokens';

import { VisitList } from './visit-list';

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
