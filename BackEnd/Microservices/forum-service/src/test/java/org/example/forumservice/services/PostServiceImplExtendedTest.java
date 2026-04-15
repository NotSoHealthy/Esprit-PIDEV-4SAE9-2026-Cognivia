package org.example.forumservice.services;

import org.example.forumservice.entities.PinnedPost;
import org.example.forumservice.entities.Post;
import org.example.forumservice.repositories.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostServiceImplExtendedTest {

    @Mock private PostRepository postRepository;
    @Mock private ReactionRepository reactionRepository;
    @Mock private PinnedPostRepository pinnedPostRepository;
    @Mock private CommentRepository commentRepository;
    @Mock private ReportRepository reportRepository;
    @Mock private UserLookupService userLookupService;
    @Mock private AnalysisService analysisService;
    @Mock private BadWordFilterService badWordFilterService;

    @InjectMocks
    private PostServiceImpl postService;

    private Post basePost;

    @BeforeEach
    void setUp() {
        basePost = new Post();
        basePost.setId(1L);
        basePost.setUserId("author");
        basePost.setTitle("Memory tips for caregivers");
        basePost.setContent("Some helpful content");
        basePost.setBanned(false);
        basePost.setKeywords(new ArrayList<>());
    }

    // ─── updatePost ──────────────────────────────────────────────────────────

    @Test
    void updatePost_updatesFieldsAndReclassifies() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(basePost));
        when(commentRepository.findByPostId(1L)).thenReturn(Collections.emptyList());
        when(analysisService.extractKeywords(anyString())).thenReturn(List.of("memory", "caregiver"));
        when(analysisService.determineCategory(anyList())).thenReturn("Care & Support");
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));

        Post update = new Post();
        update.setTitle("Updated Title");
        update.setContent("Updated Content about memory and caregiver");

        Post result = postService.updatePost(1L, update);

        assertEquals("Updated Title", result.getTitle());
        assertEquals("Updated Content about memory and caregiver", result.getContent());
        assertEquals("Care & Support", result.getCategory());
        verify(badWordFilterService).validateText(anyString());
        verify(postRepository).save(basePost);
    }

    @Test
    void updatePost_withBadWord_throwsException() {
        doThrow(new RuntimeException("Inappropriate language")).when(badWordFilterService).validateText(anyString());

        Post update = new Post();
        update.setTitle("idiot's guide");
        update.setContent("some content");

        assertThrows(RuntimeException.class, () -> postService.updatePost(1L, update));
        verify(postRepository, never()).save(any());
    }

    // ─── deletePost ──────────────────────────────────────────────────────────

    @Test
    void deletePost_delegatesToRepository() {
        postService.deletePost(1L);
        verify(postRepository).deleteById(1L);
    }

    // ─── togglePin ───────────────────────────────────────────────────────────

    @Test
    void togglePin_pinnedPost_unpinsIt() {
        PinnedPost existing = new PinnedPost();
        existing.setPost(basePost);
        existing.setUserId("user1");

        when(postRepository.findById(1L)).thenReturn(Optional.of(basePost));
        when(commentRepository.findByPostId(1L)).thenReturn(Collections.emptyList());
        when(pinnedPostRepository.findByPostAndUserId(basePost, "user1")).thenReturn(Optional.of(existing));

        Post result = postService.togglePin(1L, "user1");

        assertFalse(result.getPinned());
        verify(pinnedPostRepository).delete(existing);
        verify(pinnedPostRepository, never()).save(any());
    }

    @Test
    void togglePin_unpinnedPost_pinsIt() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(basePost));
        when(commentRepository.findByPostId(1L)).thenReturn(Collections.emptyList());
        when(pinnedPostRepository.findByPostAndUserId(basePost, "user1")).thenReturn(Optional.empty());

        Post result = postService.togglePin(1L, "user1");

        assertTrue(result.getPinned());
        verify(pinnedPostRepository).save(any(PinnedPost.class));
        verify(pinnedPostRepository, never()).delete(any());
    }

    // ─── reportPost ──────────────────────────────────────────────────────────

    @Test
    void reportPost_byAuthor_throwsException() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(basePost));

        assertThrows(RuntimeException.class, () -> postService.reportPost(1L, "author"));
        verify(reportRepository, never()).save(any());
    }

    @Test
    void reportPost_duplicateReport_isIgnored() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(basePost));
        when(reportRepository.existsByPost_IdAndUserId(1L, "reporter")).thenReturn(true);

        postService.reportPost(1L, "reporter");

        verify(reportRepository, never()).save(any());
    }

    @Test
    void reportPost_firstReport_doesNotBan() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(basePost));
        when(reportRepository.existsByPost_IdAndUserId(1L, "reporter")).thenReturn(false);
        when(reportRepository.countByPost_Id(1L)).thenReturn(1L); // below threshold

        postService.reportPost(1L, "reporter");

        assertFalse(basePost.getBanned());
        verify(postRepository, never()).save(any()); // no ban save
    }

    @Test
    void reportPost_atThreshold_bansPost() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(basePost));
        when(reportRepository.existsByPost_IdAndUserId(1L, "reporter")).thenReturn(false);
        when(reportRepository.countByPost_Id(1L)).thenReturn(2L); // at threshold

        postService.reportPost(1L, "reporter");

        assertTrue(basePost.getBanned());
        verify(postRepository).save(basePost);
    }

    // ─── removeReportsFromPost ───────────────────────────────────────────────

    @Test
    void removeReportsFromPost_clearsReportsAndUnbans() {
        basePost.setBanned(true);
        when(postRepository.findById(1L)).thenReturn(Optional.of(basePost));
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));

        postService.removeReportsFromPost(1L);

        assertFalse(basePost.getBanned());
        verify(reportRepository).deleteByPost_Id(1L);
        verify(postRepository).save(basePost);
    }

    @Test
    void removeReportsFromPost_postNotFound_throwsException() {
        when(postRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> postService.removeReportsFromPost(99L));
    }

    // ─── repostPost ──────────────────────────────────────────────────────────

    @Test
    void repostPost_createsCopyWithOriginalReference() {
        when(postRepository.findById(1L)).thenReturn(Optional.of(basePost));
        when(commentRepository.findByPostId(1L)).thenReturn(Collections.emptyList());
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));

        Post result = postService.repostPost(1L, "reposter", "repostUser");

        assertTrue(result.getIsRepost());
        assertEquals(1L, result.getOriginalPostId());
        assertEquals("author", result.getOriginalUserId());
        assertEquals("reposter", result.getUserId());
        assertEquals("repostUser", result.getUsername());
        assertFalse(result.getBanned());
    }

    // ─── getKeywordFrequencies ───────────────────────────────────────────────

    @Test
    void getKeywordFrequencies_aggregatesCorrectly() {
        Post p1 = new Post();
        p1.setKeywords(List.of("memory", "caregiver"));
        Post p2 = new Post();
        p2.setKeywords(List.of("memory", "brain"));

        when(postRepository.findAll()).thenReturn(List.of(p1, p2));

        Map<String, Long> freqs = postService.getKeywordFrequencies();

        assertEquals(2L, freqs.get("memory"));
        assertEquals(1L, freqs.get("caregiver"));
        assertEquals(1L, freqs.get("brain"));
    }

    @Test
    void getKeywordFrequencies_emptyRepository_returnsEmptyMap() {
        when(postRepository.findAll()).thenReturn(Collections.emptyList());

        Map<String, Long> freqs = postService.getKeywordFrequencies();

        assertTrue(freqs.isEmpty());
    }

    // ─── reclassifyAllPosts ──────────────────────────────────────────────────

    @Test
    void reclassifyAllPosts_updatesEachPost() {
        Post p1 = new Post(); p1.setTitle("A"); p1.setContent("brain neuron");
        Post p2 = new Post(); p2.setTitle("B"); p2.setContent("caregiver help");

        when(postRepository.findAll()).thenReturn(List.of(p1, p2));
        when(analysisService.extractKeywords(anyString())).thenReturn(List.of("keyword"));
        when(analysisService.determineCategory(anyList())).thenReturn("Neurology", "Care & Support");

        postService.reclassifyAllPosts();

        verify(analysisService, times(2)).extractKeywords(anyString());
        verify(analysisService, times(2)).determineCategory(anyList());
        verify(postRepository).saveAll(anyList());
    }

    // ─── getPostById edge cases ──────────────────────────────────────────────

    @Test
    void getPostById_notFound_throwsException() {
        when(postRepository.findById(99L)).thenReturn(Optional.empty());

        RuntimeException ex = assertThrows(RuntimeException.class, () -> postService.getPostById(99L));
        assertTrue(ex.getMessage().contains("99"));
    }

    @Test
    void createPost_withBadWord_throwsException() {
        doThrow(new RuntimeException("Inappropriate language: idiot"))
                .when(badWordFilterService).validateText(anyString());

        assertThrows(RuntimeException.class, () -> postService.createPost(basePost));
        verify(postRepository, never()).save(any());
    }
}
