package org.example.forumservice.services;

import org.example.forumservice.entities.Post;
import org.example.forumservice.entities.Reaction;
import org.example.forumservice.entities.ReactionType;
import org.example.forumservice.repositories.PostRepository;
import org.example.forumservice.repositories.ReactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReactionServiceImplTest {

    @Mock
    private ReactionRepository reactionRepository;

    @Mock
    private PostRepository postRepository;

    @InjectMocks
    private ReactionServiceImpl reactionService;

    private Post testPost;
    private Reaction testReaction;

    @BeforeEach
    void setUp() {
        testPost = new Post();
        testPost.setId(100L);

        testReaction = new Reaction();
        testReaction.setUserId("user1");
        testReaction.setType(ReactionType.LIKE);
    }

    @Test
    void testAddReaction_NewReaction() {
        when(postRepository.findById(100L)).thenReturn(Optional.of(testPost));
        when(reactionRepository.findByPost_IdAndUserId(100L, "user1")).thenReturn(Optional.empty());
        when(reactionRepository.saveAndFlush(any(Reaction.class))).thenReturn(testReaction);

        Reaction result = reactionService.addReaction(100L, testReaction);

        assertNotNull(result);
        assertEquals(ReactionType.LIKE, result.getType());
        verify(reactionRepository).saveAndFlush(any(Reaction.class));
    }

    @Test
    void testAddReaction_ToggleOff() {
        Reaction existing = new Reaction();
        existing.setType(ReactionType.LIKE);
        existing.setUserId("user1");
        testPost.getReactions().add(existing);

        when(postRepository.findById(100L)).thenReturn(Optional.of(testPost));
        when(reactionRepository.findByPost_IdAndUserId(100L, "user1")).thenReturn(Optional.of(existing));

        Reaction result = reactionService.addReaction(100L, testReaction);

        assertNotNull(result);
        verify(reactionRepository).delete(existing);
        assertFalse(testPost.getReactions().contains(existing));
    }

    @Test
    void testAddReaction_ChangeType() {
        Reaction existing = new Reaction();
        existing.setType(ReactionType.DISLIKE);
        existing.setUserId("user1");

        when(postRepository.findById(100L)).thenReturn(Optional.of(testPost));
        when(reactionRepository.findByPost_IdAndUserId(100L, "user1")).thenReturn(Optional.of(existing));
        when(reactionRepository.saveAndFlush(any(Reaction.class))).thenReturn(existing);

        Reaction result = reactionService.addReaction(100L, testReaction);

        assertNotNull(result);
        assertEquals(ReactionType.LIKE, existing.getType());
        verify(reactionRepository).saveAndFlush(existing);
    }

    @Test
    void testDeleteReaction() {
        reactionService.deleteReaction(1L);
        verify(reactionRepository).deleteById(1L);
    }
}
