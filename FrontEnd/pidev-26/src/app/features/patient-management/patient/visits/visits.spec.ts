import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../../core/api/api.tokens';

import { Visits } from './visits';

describe('Visits', () => {
  let component: Visits;
  let fixture: ComponentFixture<Visits>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Visits],
      providers: [
        provideHttpClientTesting(),
        {
          provide: API_BASE_URL,
          useValue: 'http://localhost',
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Visits);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
