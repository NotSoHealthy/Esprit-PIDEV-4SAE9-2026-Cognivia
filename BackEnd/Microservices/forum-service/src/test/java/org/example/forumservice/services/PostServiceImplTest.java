package org.example.forumservice.services;

import org.example.forumservice.entities.Post;
import org.example.forumservice.repositories.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PostServiceImplTest {

    @Mock
    private PostRepository postRepository;
    @Mock
    private ReactionRepository reactionRepository;
    @Mock
    private PinnedPostRepository pinnedPostRepository;
    @Mock
    private CommentRepository commentRepository;
    @Mock
    private ReportRepository reportRepository;
    @Mock
    private UserLookupService userLookupService;
    @Mock
    private AnalysisService analysisService;
    @Mock
    private BadWordFilterService badWordFilterService;

    @InjectMocks
    private PostServiceImpl postService;

    private Post testPost;

    @BeforeEach
    void setUp() {
        testPost = new Post();
        testPost.setId(1L);
        testPost.setUserId("user1");
        testPost.setTitle("Test Title");
        testPost.setContent("Test Content");
        testPost.setBanned(false);
        testPost.setKeywords(new ArrayList<>());
    }

    @Test
    void testCreatePost_Success() {
        when(analysisService.extractKeywords(anyString())).thenReturn(Collections.singletonList("test"));
        when(analysisService.determineCategory(anyList())).thenReturn("GENERAL");
        when(postRepository.save(any(Post.class))).thenReturn(testPost);

        Post result = postService.createPost(testPost);

        assertNotNull(result);
        verify(badWordFilterService, times(1)).validateText(anyString());
        verify(postRepository, times(1)).save(any(Post.class));
    }

    @Test
    void testGetPostById_Success() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(testPost));
        when(commentRepository.findByPostId(1L)).thenReturn(Collections.emptyList());

        Post result = postService.getPostById(1L);

        assertEquals("Test Title", result.getTitle());
    }

    @Test
    void testGetPostById_Banned() {
        testPost.setBanned(true);
        when(postRepository.findById(1L)).thenReturn(Optional.of(testPost));

        assertThrows(RuntimeException.class, () -> postService.getPostById(1L));
    }

    @Test
    void testReportPost_BannedTrigger() {
        Post targetPost = new Post();
        targetPost.setId(2L);
        targetPost.setUserId("otherUser");

        when(postRepository.findById(2L)).thenReturn(Optional.of(targetPost));
        when(reportRepository.existsByPost_IdAndUserId(2L, "user1")).thenReturn(false);
        when(reportRepository.countByPost_Id(2L)).thenReturn(2L); // Trigger ban threshold

        postService.reportPost(2L, "user1");

        assertTrue(targetPost.getBanned());
        verify(postRepository, times(1)).save(targetPost);
    }
}
