import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatComponent } from './chat.component';
import { ChatService, UserInfo } from './services/chat.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { KeycloakService } from '../../core/auth/keycloak.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ChatComponent', () => {
  let component: ChatComponent;
  let fixture: ComponentFixture<ChatComponent>;
  let mockChatService: any;
  let mockKeycloakService: any;

  beforeEach(async () => {
    mockChatService = {
      getChatSummary: jasmine.createSpy('getChatSummary').and.returnValue(of([])),
      getUserInfo: jasmine.createSpy('getUserInfo').and.returnValue(of({ id: 'u1', name: 'User 1' })),
      getAllUsers: jasmine.createSpy('getAllUsers').and.returnValue(of([])),
      getUserGroups: jasmine.createSpy('getUserGroups').and.returnValue(of([])),
      getUnreadCount: jasmine.createSpy('getUnreadCount').and.returnValue(of(0)),
      getUserRestriction: jasmine.createSpy('getUserRestriction').and.returnValue(of(null)),
      markConversationAsRead: jasmine.createSpy('markConversationAsRead').and.returnValue(of({})),
      getConversation: jasmine.createSpy('getConversation').and.returnValue(of([]))
    };

    mockKeycloakService = {
        getUserId: jasmine.createSpy('getUserId').and.returnValue('u1'),
        getUserRole: jasmine.createSpy('getUserRole').and.returnValue('Patient')
    };

    await TestBed.configureTestingModule({
      imports: [ 
        ChatComponent, 
        HttpClientTestingModule,
        NoopAnimationsModule 
      ],
      providers: [
        { provide: ChatService, useValue: mockChatService },
        { provide: KeycloakService, useValue: mockKeycloakService },
        { provide: NzModalService, useValue: {} },
        { provide: NzMessageService, useValue: {} },
        { 
          provide: ActivatedRoute, 
          useValue: { 
            queryParams: of({}),
            snapshot: { queryParamMap: { get: () => null } }
          } 
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show summary option if unread count >= 10', () => {
    const user: UserInfo = { id: 'u2', name: 'User 2', role: 'User' };
    component.unreadCounts['u2'] = 15;
    
    component.selectUser(user);
    
    expect(component.showSummaryOption).toBeTrue();
  });

  it('should not show summary option if unread count < 10', () => {
    const user: UserInfo = { id: 'u2', name: 'User 2', role: 'User' };
    component.unreadCounts['u2'] = 5;
    
    component.selectUser(user);
    
    expect(component.showSummaryOption).toBeFalse();
  });
});
