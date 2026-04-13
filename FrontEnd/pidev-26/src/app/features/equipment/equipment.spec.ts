import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Equipment } from './equipment';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../core/api/api.tokens';

describe('Equipment', () => {
  let component: Equipment;
  let fixture: ComponentFixture<Equipment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Equipment, HttpClientTestingModule],
      providers: [
        {
          provide: API_BASE_URL,
          useValue: 'http://api-test'
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Equipment);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
