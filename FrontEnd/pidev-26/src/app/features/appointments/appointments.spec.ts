import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Appointments } from './appointments';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../core/api/api.tokens';

describe('Appointments', () => {
  let component: Appointments;
  let fixture: ComponentFixture<Appointments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Appointments, HttpClientTestingModule],
      providers: [
        {
          provide: API_BASE_URL,
          useValue: 'http://api-test'
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Appointments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
