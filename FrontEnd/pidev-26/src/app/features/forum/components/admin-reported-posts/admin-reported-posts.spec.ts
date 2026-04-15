import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminReportedPosts } from './admin-reported-posts';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateService } from '@ngx-translate/core';
import { API_BASE_URL } from '../../../../core/api/api.tokens';

describe('AdminReportedPosts', () => {
  let component: AdminReportedPosts;
  let fixture: ComponentFixture<AdminReportedPosts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminReportedPosts, HttpClientTestingModule, RouterTestingModule],
      providers: [
        {
          provide: TranslateService,
          useValue: jasmine.createSpyObj('TranslateService', ['get', 'use', 'onTranslationChange', 'onLangChange', 'onDefaultLangChange'])
        },
        {
          provide: API_BASE_URL,
          useValue: 'http://api-test'
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminReportedPosts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
