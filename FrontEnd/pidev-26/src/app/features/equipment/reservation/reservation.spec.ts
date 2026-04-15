import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Reservation } from './reservation';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../core/api/api.tokens';
import { KeycloakService } from '../../../core/auth/keycloak.service';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';

describe('Reservation', () => {
  let component: Reservation;
  let fixture: ComponentFixture<Reservation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reservation, HttpClientTestingModule, RouterTestingModule, TranslateModule.forRoot()],
      providers: [
        {
          provide: API_BASE_URL,
          useValue: 'http://api-test'
        },
        {
          provide: KeycloakService,
          useValue: {
            isLoggedIn: () => true
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Reservation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
