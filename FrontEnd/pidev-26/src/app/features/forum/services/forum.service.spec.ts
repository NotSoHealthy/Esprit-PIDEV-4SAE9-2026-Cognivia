import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ForumService } from './forum.service';
import { API_BASE_URL } from '../../../core/api/api.tokens';
import { KeycloakService } from '../../../core/auth/keycloak.service';

describe('ForumService', () => {
  let service: ForumService;
  let httpMock: HttpTestingController;
  let mockKeycloak: jasmine.SpyObj<KeycloakService>;
  const baseUrl = 'http://api-gateway';

  beforeEach(() => {
    mockKeycloak = jasmine.createSpyObj<KeycloakService>('KeycloakService', ['getUserId', 'getUsername']);
    mockKeycloak.getUserId.and.returnValue('u1');
    mockKeycloak.getUsername.and.returnValue('User1');

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

  // Post Operations
  it('should fetch all posts with default parameters', () => {
    service.getAllPosts().subscribe(result => {
      expect(result.content).toEqual([]);
    });

    const req = httpMock.expectOne(request =>
      request.url === `${baseUrl}/posts` &&
      request.params.get('page') === '0' &&
      request.params.get('size') === '10' &&
      request.params.get('userId') === 'u1'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: [] });
  });

  it('should fetch all posts with category filter', () => {
    service.getAllPosts(0, 5, 'HEALTH').subscribe(result => {
      expect(result.content).toEqual([]);
    });

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

  it('should fetch all posts with keyword search', () => {
    service.getAllPosts(0, 10, 'all', 'medication').subscribe();

    const req = httpMock.expectOne(request =>
      request.url === `${baseUrl}/posts` &&
      request.params.get('keyword') === 'medication'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: [] });
  });

  it('should fetch a post by ID', () => {
    const post = { id: 1, title: 'Test Post', content: 'Test Content' };
    service.getPostById(1).subscribe(result => {
      expect(result.title).toBe('Test Post');
    });

    const req = httpMock.expectOne(`${baseUrl}/posts/1`);
    expect(req.request.method).toBe('GET');
    req.flush(post);
  });

  it('should create a new post', () => {
    const newPost = { title: 'New Post', content: 'New Content' };
    service.createPost(newPost as any).subscribe(result => {
      expect(result.userId).toBe('u1');
    });

    const req = httpMock.expectOne(`${baseUrl}/posts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.title).toBe('New Post');
    expect(req.request.body.userId).toBe('u1');
    req.flush({ ...newPost, userId: 'u1' });
  });

  it('should update a post', () => {
    const updatedPost = { id: 1, title: 'Updated Post', content: 'Updated Content' };
    service.updatePost(1, updatedPost as any).subscribe(result => {
      expect(result.title).toBe('Updated Post');
    });

    const req = httpMock.expectOne(`${baseUrl}/posts/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(updatedPost);
  });

  it('should delete a post', () => {
    service.deletePost(1).subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne(`${baseUrl}/posts/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // Comment Operations
  it('should fetch comments for a post', () => {
    const comments = [{ id: 1, content: 'Great post!' }];
    service.getCommentsByPostId(1).subscribe(result => {
      expect(result.length).toBe(1);
      expect(result[0].content).toBe('Great post!');
    });

    const req = httpMock.expectOne(`${baseUrl}/posts/1/comments`);
    expect(req.request.method).toBe('GET');
    req.flush(comments);
  });

  it('should add a comment to a post', () => {
    const comment = { content: 'Nice comment' };
    service.addComment(1, comment as any).subscribe(result => {
      expect(result.userId).toBe('u1');
    });

    const req = httpMock.expectOne(`${baseUrl}/posts/1/comments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.userId).toBe('u1');
    req.flush({ ...comment, userId: 'u1' });
  });

  it('should update a comment', () => {
    const updatedComment = { id: 1, content: 'Updated comment' };
    service.updateComment(1, 1, updatedComment as any).subscribe(result => {
      expect(result.content).toBe('Updated comment');
    });

    const req = httpMock.expectOne(`${baseUrl}/posts/1/comments/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(updatedComment);
  });

  it('should delete a comment', () => {
    service.deleteComment(1, 1).subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne(`${baseUrl}/posts/1/comments/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // Reaction Operations
  it('should fetch reactions for a post', () => {
    const reactions = [{ id: 1, type: 'LIKE', userId: 'u2' }];
    service.getReactionsByPostId(1).subscribe(result => {
      expect(result.length).toBe(1);
      expect(result[0].type).toBe('LIKE');
    });

    const req = httpMock.expectOne(`${baseUrl}/posts/1/reactions`);
    expect(req.request.method).toBe('GET');
    req.flush(reactions);
  });

  it('should add a reaction to a post', () => {
    const reaction = { type: 'LIKE' };
    service.addReaction(1, reaction as any).subscribe(result => {
      expect(result.userId).toBe('u1');
    });

    const req = httpMock.expectOne(`${baseUrl}/posts/1/reactions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.userId).toBe('u1');
    req.flush({ ...reaction, userId: 'u1' });
  });

  it('should delete a reaction', () => {
    service.deleteReaction(1, 1).subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne(`${baseUrl}/posts/reactions/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // Pin Operation
  it('should toggle pin status of a post', () => {
    const pinnedPost = { id: 1, title: 'Pinned Post', pinned: true };
    service.togglePin(1).subscribe(result => {
      expect(result.pinned).toBe(true);
    });

    const req = httpMock.expectOne(`${baseUrl}/posts/1/pin?userId=u1`);
    expect(req.request.method).toBe('PATCH');
    req.flush(pinnedPost);
  });

  // Reporting Operations
  it('should report a post', () => {
    service.reportPost(1).subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne(`${baseUrl}/posts/1/report?userId=u1`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('should get reported posts for admin', () => {
    const reportedPosts = [{ id: 1, title: 'Reported Post', reportCount: 3 }];
    service.getReportedPosts(0, 10).subscribe(result => {
      expect(result.content).toEqual(reportedPosts);
    });

    const req = httpMock.expectOne(request =>
      request.url === `${baseUrl}/posts/reported` &&
      request.params.get('page') === '0' &&
      request.params.get('size') === '10'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ content: reportedPosts });
  });

  it('should remove all reports from a post', () => {
    service.removeReportsFromPost(1).subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne(`${baseUrl}/posts/1/reports`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  // Admin Operations
  it('should get word cloud data', () => {
    const wordCloud = { words: ['health', 'medication', 'care'] };
    service.getWordCloud().subscribe(result => {
      expect(result.words).toContain('health');
    });

    const req = httpMock.expectOne(`${baseUrl}/posts/analysis/word-cloud`);
    expect(req.request.method).toBe('GET');
    req.flush(wordCloud);
  });

  it('should reclassify all posts', () => {
    service.reclassifyAllPosts().subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne(`${baseUrl}/posts/reclassify`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  // Repost Operation
  it('should repost a post', () => {
    const repostedPost = { id: 2, title: 'Reposted Post', originalPostId: 1 };
    service.repostPost(1).subscribe(result => {
      expect(result.originalPostId).toBe(1);
    });

    const req = httpMock.expectOne(request =>
      request.url === `${baseUrl}/posts/1/repost` &&
      request.params.get('userId') === 'u1' &&
      request.params.get('username') === 'User1'
    );
    expect(req.request.method).toBe('POST');
    req.flush(repostedPost);
  });

  // Summary Operation
  it('should get post summary', () => {
    const summary = 'This is a summary of the post about health tips.';
    service.getPostSummary(1).subscribe(result => {
      expect(result).toContain('summary');
    });

    const req = httpMock.expectOne(`${baseUrl}/posts/1/summarize`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('text');
    req.flush(summary);
  });
});
