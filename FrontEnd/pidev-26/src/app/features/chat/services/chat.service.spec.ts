import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChatService } from './chat.service';
import { environment } from '../../../../environments/environment';

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/chat`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ChatService]
    });
    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Message Operations
  it('should send a message via POST', () => {
    const dummyMessage = { content: 'Hello', senderId: 'u1' };
    service.sendMessage(dummyMessage).subscribe(msg => {
      expect(msg.content).toBe('Hello');
    });

    const req = httpMock.expectOne(`${apiUrl}/send`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dummyMessage);
    req.flush(dummyMessage);
  });

  it('should fetch conversation between two users', () => {
    service.getConversation('u1', 'u2').subscribe(msgs => {
      expect(msgs.length).toBe(0);
    });

    const req = httpMock.expectOne(request => 
      request.url === `${apiUrl}/conversation` &&
      request.params.get('user1') === 'u1' &&
      request.params.get('user2') === 'u2'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should fetch recent contacts for a user', () => {
    service.getRecentContacts('u1').subscribe(contacts => {
      expect(contacts).toEqual(['u2', 'u3']);
    });

    const req = httpMock.expectOne(`${apiUrl}/contacts/u1`);
    expect(req.request.method).toBe('GET');
    req.flush(['u2', 'u3']);
  });

  it('should get user information', () => {
    const userInfo = { id: 'u1', name: 'John', role: 'Caregiver', isAdmin: false };
    service.getUserInfo('u1').subscribe(user => {
      expect(user.name).toBe('John');
      expect(user.role).toBe('Caregiver');
    });

    const req = httpMock.expectOne(`${apiUrl}/user/u1`);
    expect(req.request.method).toBe('GET');
    req.flush(userInfo);
  });

  it('should fetch all users', () => {
    const users = [
      { id: 'u1', name: 'John', role: 'Caregiver' },
      { id: 'u2', name: 'Jane', role: 'Doctor' }
    ];
    service.getAllUsers().subscribe(allUsers => {
      expect(allUsers.length).toBe(2);
      expect(allUsers[0].name).toBe('John');
    });

    const req = httpMock.expectOne(`${apiUrl}/users`);
    expect(req.request.method).toBe('GET');
    req.flush(users);
  });

  it('should mark a message as read', () => {
    service.markAsRead(1).subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne(`${apiUrl}/read/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });

  it('should get unread count between two users', () => {
    service.getUnreadCount('u1', 'u2').subscribe(count => {
      expect(count).toBe(3);
    });

    const req = httpMock.expectOne(request =>
      request.url === `${apiUrl}/unread-count` &&
      request.params.get('recipientId') === 'u1' &&
      request.params.get('senderId') === 'u2'
    );
    expect(req.request.method).toBe('GET');
    req.flush(3);
  });

  it('should mark entire conversation as read', () => {
    service.markConversationAsRead('u1', 'u2').subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne(request =>
      request.url === `${apiUrl}/read-conversation` &&
      request.params.get('recipientId') === 'u1' &&
      request.params.get('senderId') === 'u2'
    );
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });

  it('should edit a message', () => {
    const editedMessage = { id: 1, content: 'Edited Hello', senderId: 'u1' };
    service.editMessage(1, 'Edited Hello').subscribe(msg => {
      expect(msg.content).toBe('Edited Hello');
    });

    const req = httpMock.expectOne(`${apiUrl}/edit/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ content: 'Edited Hello' });
    req.flush(editedMessage);
  });

  it('should delete a message', () => {
    service.deleteMessage(1).subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne(`${apiUrl}/delete/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should get last message between two users', () => {
    const lastMsg = { id: 5, content: 'Last message', senderId: 'u1' };
    service.getLastMessage('u1', 'u2').subscribe(msg => {
      expect(msg.id).toBe(5);
      expect(msg.content).toBe('Last message');
    });

    const req = httpMock.expectOne(request =>
      request.url === `${apiUrl}/last-message` &&
      request.params.get('user1') === 'u1' &&
      request.params.get('user2') === 'u2'
    );
    expect(req.request.method).toBe('GET');
    req.flush(lastMsg);
  });

  it('should react to a message', () => {
    service.reactToMessage(1, 'u1', 'LIKE').subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne(`${apiUrl}/react/1`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ userId: 'u1', type: 'LIKE' });
    req.flush({});
  });

  it('should get chat summary for a user', () => {
    const summary = [
      { contactId: 'u2', unreadCount: 2, lastMessage: { id: 1, content: 'Hi' } },
      { contactId: 'u3', unreadCount: 0, lastMessage: { id: 2, content: 'Hey' } }
    ];
    service.getChatSummary('u1').subscribe(summaries => {
      expect(summaries.length).toBe(2);
      expect(summaries[0].unreadCount).toBe(2);
    });

    const req = httpMock.expectOne(`${apiUrl}/summary/u1`);
    expect(req.request.method).toBe('GET');
    req.flush(summary);
  });

  // Group Chat Operations
  it('should create a group chat', () => {
    service.createGroup('Team Group', 'u1', ['u2', 'u3']).subscribe(group => {
      expect(group.name).toBe('Team Group');
    });

    const req = httpMock.expectOne(`${apiUrl}/group/create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Team Group', creatorId: 'u1', memberIds: ['u2', 'u3'] });
    req.flush({ id: 1, name: 'Team Group' });
  });

  it('should fetch user groups', () => {
    const groups = [{ id: 1, name: 'Group 1' }, { id: 2, name: 'Group 2' }];
    service.getUserGroups('u1').subscribe(userGroups => {
      expect(userGroups.length).toBe(2);
    });

    const req = httpMock.expectOne(`${apiUrl}/group/user/u1`);
    expect(req.request.method).toBe('GET');
    req.flush(groups);
  });

  it('should get group messages', () => {
    const messages = [{ id: 1, content: 'Group msg 1' }];
    service.getGroupMessages(1).subscribe(msgs => {
      expect(msgs.length).toBe(1);
    });

    const req = httpMock.expectOne(`${apiUrl}/group/1/messages`);
    expect(req.request.method).toBe('GET');
    req.flush(messages);
  });

  it('should get group members', () => {
    const members = [
      { userId: 'u1', isAdmin: true },
      { userId: 'u2', isAdmin: false }
    ];
    service.getGroupMembers(1).subscribe(groupMembers => {
      expect(groupMembers.length).toBe(2);
      expect(groupMembers[0].isAdmin).toBe(true);
    });

    const req = httpMock.expectOne(`${apiUrl}/group/1/members`);
    expect(req.request.method).toBe('GET');
    req.flush(members);
  });

  it('should add members to group', () => {
    service.addGroupMembers(1, ['u3', 'u4']).subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne(`${apiUrl}/group/1/members`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(['u3', 'u4']);
    req.flush(null);
  });

  it('should remove member from group', () => {
    service.removeGroupMember(1, 'u2').subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne(`${apiUrl}/group/1/members/u2`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should mark group as read for a user', () => {
    service.markGroupAsRead(1, 'u1').subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne(`${apiUrl}/group/1/read/u1`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('should promote user to admin in group', () => {
    service.promoteToAdmin(1, 'u2').subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne(`${apiUrl}/group/1/promote/u2`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('should clear group history', () => {
    service.clearGroupHistory(1).subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne(`${apiUrl}/group/1/history`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should delete group', () => {
    service.deleteGroup(1).subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne(`${apiUrl}/group/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // Reporting & Admin Methods
  it('should report a chat', () => {
    const report = { reporterId: 'u1', reportedUserId: 'u2', messageId: 5, reason: 'Inappropriate content' };
    service.reportChat(report).subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne(`${apiUrl}/report`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(report);
    req.flush(null);
  });

  it('should get all reports', () => {
    const reports = [{ id: 1, reporterId: 'u1', reason: 'Spam' }];
    service.getReports().subscribe(allReports => {
      expect(allReports.length).toBe(1);
    });

    const req = httpMock.expectOne(`${apiUrl}/admin/reports`);
    expect(req.request.method).toBe('GET');
    req.flush(reports);
  });

  it('should resolve a report', () => {
    service.resolveReport(1).subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne(`${apiUrl}/admin/reports/1/resolve`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('should get user restriction status', () => {
    const restriction = { userId: 'u1', isRestricted: true, reason: 'Violation' };
    service.getUserRestriction('u1').subscribe(userRestriction => {
      expect(userRestriction.isRestricted).toBe(true);
    });

    const req = httpMock.expectOne(`${apiUrl}/restriction/u1`);
    expect(req.request.method).toBe('GET');
    req.flush(restriction);
  });
});
