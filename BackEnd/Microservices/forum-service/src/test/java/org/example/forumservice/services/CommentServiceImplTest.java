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

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CommentServiceImplTest {

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private UserLookupService userLookupService;

    @Mock
    private BadWordFilterService badWordFilterService;

    @InjectMocks
    private CommentServiceImpl commentService;

    private Comment testComment;
    private Post testPost;

    @BeforeEach
    void setUp() {
        testPost = new Post();
        testPost.setId(100L);

        testComment = new Comment();
        testComment.setId(1L);
        testComment.setPost(testPost);
        testComment.setContent("Test Comment");
        testComment.setUserId("user1");
    }

    @Test
    void testGetCommentsByPostId() {
        when(commentRepository.findByPostId(100L)).thenReturn(Collections.singletonList(testComment));

        List<Comment> results = commentService.getCommentsByPostId(100L);

        assertFalse(results.isEmpty());
        assertEquals(1, results.size());
        verify(commentRepository).findByPostId(100L);
    }

    @Test
    void testAddComment_Success() {
        when(postRepository.findById(100L)).thenReturn(Optional.of(testPost));
        when(commentRepository.save(any(Comment.class))).thenReturn(testComment);

        Comment result = commentService.addComment(100L, testComment);

        assertNotNull(result);
        assertEquals("Test Comment", result.getContent());
        verify(badWordFilterService).validateText(anyString());
        verify(commentRepository).save(any(Comment.class));
    }

    @Test
    void testAddComment_PostNotFound() {
        when(postRepository.findById(100L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> commentService.addComment(100L, testComment));
        verify(commentRepository, never()).save(any(Comment.class));
    }

    @Test
    void testUpdateComment_Success() {
        when(commentRepository.findById(1L)).thenReturn(Optional.of(testComment));
        when(commentRepository.save(any(Comment.class))).thenReturn(testComment);

        Comment result = commentService.updateComment(1L, testComment);

        assertEquals("Test Comment", result.getContent());
        verify(commentRepository).save(any(Comment.class));
    }

    @Test
    void testDeleteComment() {
        commentService.deleteComment(1L);
        verify(commentRepository).deleteById(1L);
    }
}
