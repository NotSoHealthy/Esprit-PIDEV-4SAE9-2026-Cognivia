package org.example.forumservice.services;

import org.example.forumservice.entities.Comment;
import org.example.forumservice.entities.Post;
import org.example.forumservice.repositories.CommentRepository;
import org.example.forumservice.repositories.PostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommentServiceImplExtendedTest {

    @Mock private CommentRepository commentRepository;
    @Mock private PostRepository postRepository;
    @Mock private UserLookupService userLookupService;
    @Mock private BadWordFilterService badWordFilterService;

    @InjectMocks
    private CommentServiceImpl commentService;

    private Post testPost;
    private Comment testComment;

    @BeforeEach
    void setUp() {
        testPost = new Post();
        testPost.setId(10L);

        testComment = new Comment();
        testComment.setId(1L);
        testComment.setUserId("user1");
        testComment.setContent("Great post!");
    }

    // ─── getCommentsByPostId ─────────────────────────────────────────────────

    @Test
    void getCommentsByPostId_returnsEnrichedComments() {
        when(commentRepository.findByPostId(10L)).thenReturn(List.of(testComment));
        when(userLookupService.lookupUser("user1"))
                .thenReturn(Optional.of(new UserLookupService.UserProfile("John Doe", "Patient")));

        List<Comment> result = commentService.getCommentsByPostId(10L);

        assertEquals(1, result.size());
        assertEquals("John Doe", result.get(0).getAuthorFullName());
        assertEquals("Patient", result.get(0).getAuthorRole());
    }

    @Test
    void getCommentsByPostId_userLookupFails_gracefullySkipsEnrichment() {
        when(commentRepository.findByPostId(10L)).thenReturn(List.of(testComment));
        when(userLookupService.lookupUser(anyString())).thenReturn(Optional.empty());

        List<Comment> result = commentService.getCommentsByPostId(10L);

        assertEquals(1, result.size());
        assertNull(result.get(0).getAuthorFullName()); // not enriched — stays null
    }

    @Test
    void getCommentsByPostId_noComments_returnsEmptyList() {
        when(commentRepository.findByPostId(10L)).thenReturn(List.of());

        assertTrue(commentService.getCommentsByPostId(10L).isEmpty());
    }

    // ─── getCommentById ──────────────────────────────────────────────────────

    @Test
    void getCommentById_found_returnsEnrichedComment() {
        when(commentRepository.findById(1L)).thenReturn(Optional.of(testComment));
        when(userLookupService.lookupUser("user1"))
                .thenReturn(Optional.of(new UserLookupService.UserProfile("Jane", "Doctor")));

        Comment result = commentService.getCommentById(1L);

        assertNotNull(result);
        assertEquals("Jane", result.getAuthorFullName());
    }

    @Test
    void getCommentById_notFound_throwsException() {
        when(commentRepository.findById(99L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> commentService.getCommentById(99L));
        assertTrue(ex.getMessage().contains("99"));
    }

    // ─── addComment ──────────────────────────────────────────────────────────

    @Test
    void addComment_success_savesCommentLinkedToPost() {
        when(postRepository.findById(10L)).thenReturn(Optional.of(testPost));
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> inv.getArgument(0));

        Comment toAdd = new Comment();
        toAdd.setId(99L); // should be reset to null
        toAdd.setContent("A valid comment");

        Comment result = commentService.addComment(10L, toAdd);

        assertNull(result.getId());                       // id must be reset
        assertEquals(testPost, result.getPost());
        assertEquals("A valid comment", result.getContent());
        verify(badWordFilterService).validateText("A valid comment");
    }

    @Test
    void addComment_postNotFound_throwsException() {
        when(postRepository.findById(99L)).thenReturn(Optional.empty());

        Comment c = new Comment();
        c.setContent("Orphaned comment");

        assertThrows(RuntimeException.class, () -> commentService.addComment(99L, c));
        verify(commentRepository, never()).save(any());
    }

    @Test
    void addComment_badWord_throwsBeforeSave() {
        doThrow(new RuntimeException("Inappropriate language"))
                .when(badWordFilterService).validateText(anyString());

        Comment c = new Comment();
        c.setContent("damn that hurts");

        assertThrows(RuntimeException.class, () -> commentService.addComment(10L, c));
        verify(postRepository, never()).findById(any());
        verify(commentRepository, never()).save(any());
    }

    // ─── updateComment ───────────────────────────────────────────────────────

    @Test
    void updateComment_success_updatesContentAndSaves() {
        when(commentRepository.findById(1L)).thenReturn(Optional.of(testComment));
        when(userLookupService.lookupUser(anyString())).thenReturn(Optional.empty());
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> inv.getArgument(0));

        Comment update = new Comment();
        update.setContent("Updated content");

        Comment result = commentService.updateComment(1L, update);

        assertEquals("Updated content", result.getContent());
        verify(badWordFilterService).validateText("Updated content");
        verify(commentRepository).save(testComment);
    }

    @Test
    void updateComment_commentNotFound_throwsException() {
        when(commentRepository.findById(99L)).thenReturn(Optional.empty());

        Comment update = new Comment();
        update.setContent("irrelevant");

        assertThrows(RuntimeException.class, () -> commentService.updateComment(99L, update));
    }

    @Test
    void updateComment_badWord_throwsBeforeFind() {
        doThrow(new RuntimeException("Inappropriate language"))
                .when(badWordFilterService).validateText(anyString());

        Comment update = new Comment();
        update.setContent("kill them all");

        assertThrows(RuntimeException.class, () -> commentService.updateComment(1L, update));
        verify(commentRepository, never()).findById(any());
        verify(commentRepository, never()).save(any());
    }

    // ─── deleteComment ───────────────────────────────────────────────────────

    @Test
    void deleteComment_delegatesToRepository() {
        commentService.deleteComment(1L);
        verify(commentRepository).deleteById(1L);
    }
}
