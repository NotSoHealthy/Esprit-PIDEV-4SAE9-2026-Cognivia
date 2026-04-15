import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { registerLocaleData } from '@angular/common';
import { signal } from '@angular/core';
import { API_BASE_URL } from '../../../core/api/api.tokens';
import { NZ_I18N, en_US } from 'ng-zorro-antd/i18n';

import { Calendar } from './calendar';
import { CurrentUserService } from '../../../core/user/current-user.service';
import { Router } from '@angular/router';
import en from '@angular/common/locales/en';

registerLocaleData(en);

describe('Calendar', () => {
  let component: Calendar;
  let fixture: ComponentFixture<Calendar>;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;
  const currentUser = signal({ kind: 'caregiver' as const, data: { id: 5 } });

  beforeEach(async () => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [Calendar],
      providers: [
        provideHttpClientTesting(),
        { provide: CurrentUserService, useValue: { user: currentUser } },
        { provide: Router, useValue: router },
        { provide: NZ_I18N, useValue: en_US },
        {
          provide: API_BASE_URL,
          useValue: 'http://localhost',
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Calendar);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads visits for the logged in caregiver and groups them by date', () => {
    component.ngOnInit();

    const req = httpMock.expectOne('http://localhost/care/visit/caregiver/5');
    expect(req.request.method).toBe('GET');
    req.flush([
      { id: 1, date: '2026-04-15T08:00:00Z', status: 'scheduled', patient: { firstName: 'A', lastName: 'One' } },
      { id: 2, date: '2026-04-15T09:00:00Z', status: 'completed', patient: { firstName: 'B', lastName: 'Two' } },
      { id: 3, date: '2026-04-16T09:00:00Z', status: 'missed', patient: { firstName: 'C', lastName: 'Three' } },
    ]);

    expect(component.visits.length).toBe(3);

    const visits = component.getVisitsForDate(new Date('2026-04-15T12:00:00Z'));
    expect(visits.map((visit) => visit.id)).toEqual([1, 2]);
  });

  it('formats visit badges, titles and popover content', () => {
    expect(component.badgeStatusForVisit({ status: 'scheduled' })).toBe('processing');
    expect(component.badgeStatusForVisit({ status: 'completed' })).toBe('success');
    expect(component.badgeStatusForVisit({ status: 'missed' })).toBe('error');
    expect(component.badgeStatusForVisit({ status: 'unknown' })).toBe('default');

    const visit = {
      id: 9,
      date: '2026-04-15T10:00:00Z',
      status: 'scheduled',
      patient: { firstName: 'Mina', lastName: 'Nour', severity: 'high' },
    };

    expect(component.formatVisitForCalendar(visit)).toBe('Mina Nour');
    expect(component.popOverTitle(visit)).toContain('Mina Nour');
    expect(component.popOverContent(visit)).toContain('Status: Scheduled');
    expect(component.popOverContent(visit)).toContain('Severity: High');
  });

  it('navigates to the visit report page', () => {
    component.openVisitReport({ id: 55 });

    expect(router.navigate).toHaveBeenCalledWith(['/visit', '55', 'report'], {
      state: { visit: { id: 55 } },
    });
  });
});
