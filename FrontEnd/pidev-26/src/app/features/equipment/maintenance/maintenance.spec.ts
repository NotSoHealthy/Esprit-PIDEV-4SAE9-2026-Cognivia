import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Maintenance } from './maintenance';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { API_BASE_URL } from '../../../core/api/api.tokens';

describe('Maintenance', () => {
  let component: Maintenance;
  let fixture: ComponentFixture<Maintenance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Maintenance, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: API_BASE_URL, useValue: 'http://api-test' }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Maintenance);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
