package org.example.forumservice.services;

import org.example.forumservice.entities.Post;
import org.example.forumservice.entities.Reaction;
import org.example.forumservice.repositories.PostRepository;
import org.example.forumservice.repositories.ReactionRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReactionServiceImpl implements ReactionService {

    private final ReactionRepository reactionRepository;
    private final PostRepository postRepository;

    public ReactionServiceImpl(ReactionRepository reactionRepository, PostRepository postRepository) {
        this.reactionRepository = reactionRepository;
        this.postRepository = postRepository;
    }

    @Override
    public List<Reaction> getReactionsByPostId(Long postId) {
        return reactionRepository.findByPostId(postId);
    }

    @Override
    public Reaction addReaction(Long postId, Reaction reaction) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));

        // Find existing reaction by this user on this post
        return reactionRepository.findByPostIdAndUserId(postId, reaction.getUserId())
                .map(existingReaction -> {
                    if (existingReaction.getType() == reaction.getType()) {
                        // Same type -> toggle (remove)
                        reactionRepository.delete(existingReaction);
                        return null; // Signal that it was deleted
                    } else {
                        // Different type -> swap
                        existingReaction.setType(reaction.getType());
                        return reactionRepository.save(existingReaction);
                    }
                })
                .orElseGet(() -> {
                    // New reaction
                    reaction.setPost(post);
                    reaction.setId(null);
                    return reactionRepository.save(reaction);
                });
    }

    @Override
    public void deleteReaction(Long id) {
        reactionRepository.deleteById(id);
    }
}
