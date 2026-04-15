import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Profile } from './profile';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateService } from '@ngx-translate/core';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Profile, HttpClientTestingModule],
      providers: [
        {
          provide: TranslateService,
          useValue: jasmine.createSpyObj('TranslateService', ['get', 'use', 'onTranslationChange', 'onLangChange', 'onDefaultLangChange'])
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
