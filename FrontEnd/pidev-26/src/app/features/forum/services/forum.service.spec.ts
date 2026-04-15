import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ForumService } from './forum.service';
import { API_BASE_URL } from '../../../core/api/api.tokens';
import { KeycloakService } from '../../../core/auth/keycloak.service';

describe('ForumService', () => {
  let service: ForumService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://api-gateway';

  beforeEach(() => {
    const mockKeycloak = {
      getUserId: jasmine.createSpy('getUserId').and.returnValue('u1'),
      getUsername: jasmine.createSpy('getUsername').and.returnValue('User1')
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ForumService,
        { provide: KeycloakService, useValue: mockKeycloak },
        { provide: API_BASE_URL, useValue: baseUrl }
      ]
    });
    service = TestBed.inject(ForumService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch posts via GET with correct params', () => {
    service.getAllPosts(0, 5, 'HEALTH').subscribe();

    const req = httpMock.expectOne(request => 
      request.url === `${baseUrl}/posts` &&
      request.params.get('page') === '0' &&
      request.params.get('size') === '5' &&
      request.params.get('category') === 'HEALTH' &&
      request.params.get('userId') === 'u1'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: [] });
  });
});
