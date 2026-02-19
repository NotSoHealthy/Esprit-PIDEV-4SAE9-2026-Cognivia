import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/api/api.tokens';

import { Caregiver } from './caregiver';

describe('Caregiver', () => {
  let component: Caregiver;
  let fixture: ComponentFixture<Caregiver>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Caregiver],
      providers: [
        provideHttpClientTesting(),
        {
          provide: API_BASE_URL,
          useValue: 'http://localhost',
        },
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
