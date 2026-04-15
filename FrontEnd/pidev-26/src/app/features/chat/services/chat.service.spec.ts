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

  it('should send a message via POST', () => {
    const dummyMessage = { content: 'Hello', senderId: 'u1' };
    service.sendMessage(dummyMessage).subscribe(msg => {
      expect(msg.content).toBe('Hello');
    });

    const req = httpMock.expectOne(`${apiUrl}/send`);
    expect(req.request.method).toBe('POST');
    req.flush(dummyMessage);
  });

  it('should fetch conversation via GET', () => {
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
});
