import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PostListComponent } from './post-list.component';
import { ForumService } from '../../services/forum.service';
import { KeycloakService } from '../../../../core/auth/keycloak.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('PostListComponent', () => {
  let component: PostListComponent;
  let fixture: ComponentFixture<PostListComponent>;
  let mockForumService: any;
  let mockKeycloakService: any;
  let mockTranslateService: any;

  beforeEach(async () => {
    mockForumService = {
      getAllPosts: jasmine.createSpy('getAllPosts').and.returnValue(of({
        content: [{ id: 1, title: 'Sample Post', content: 'Body', userId: 'u2' }],
        totalElements: 1,
        first: true,
        last: true,
        number: 0
      })),
      getPostSummary: jasmine.createSpy('getPostSummary').and.returnValue(of('Summary'))
    };

    mockKeycloakService = {
      getUserId: jasmine.createSpy('getUserId').and.returnValue('u1'),
      getUsername: jasmine.createSpy('getUsername').and.returnValue('User1')
    };

    mockTranslateService = jasmine.createSpyObj('TranslateService', ['get', 'use', 'onTranslationChange', 'onLangChange', 'onDefaultLangChange']);
    mockTranslateService.get.and.returnValue(of(''));

    await TestBed.configureTestingModule({
      imports: [ 
        PostListComponent, 
        NoopAnimationsModule, 
        HttpClientTestingModule,
        RouterTestingModule 
      ],
      providers: [
        { provide: ForumService, useValue: mockForumService },
        { provide: KeycloakService, useValue: mockKeycloakService },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: NzMessageService, useValue: {} },
        { provide: NzModalService, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
            params: of({}),
            snapshot: { queryParamMap: { get: () => null } }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PostListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load posts on init', () => {
    expect(mockForumService.getAllPosts).toHaveBeenCalled();
    expect(component.posts.length).toBe(1);
  });

  it('should filter posts by category', () => {
    component.selectCategory('Neurology');
    expect(component.selectedCategory).toBe('Neurology');
    expect(mockForumService.getAllPosts).toHaveBeenCalled();
  });

  it('should go to next page', () => {
    component.isLastPage = false;
    component.nextPage();
    expect(component.currentPage).toBe(1);
    expect(mockForumService.getAllPosts).toHaveBeenCalled();
  });
});
