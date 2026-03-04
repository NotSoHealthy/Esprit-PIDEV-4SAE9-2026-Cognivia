package org.example.forumservice.services;

import org.example.forumservice.entities.Reaction;

import java.util.List;

public interface ReactionService {
    List<Reaction> getReactionsByPostId(Long postId);
    Reaction addReaction(Long postId, Reaction reaction);
    void deleteReaction(Long id);
}
