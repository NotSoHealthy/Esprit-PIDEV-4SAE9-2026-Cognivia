package org.example.forumservice.services;

import lombok.RequiredArgsConstructor;
import org.example.forumservice.entities.Post;
import org.example.forumservice.entities.Reaction;
import org.example.forumservice.repositories.PostRepository;
import org.example.forumservice.repositories.ReactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class ReactionServiceImpl implements ReactionService {

    private final ReactionRepository reactionRepository;
    private final PostRepository postRepository;

    @Override
    public List<Reaction> getReactionsByPostId(Long postId) {
        return reactionRepository.findByPostId(postId);
    }

    @Override
    public Reaction addReaction(Long postId, Reaction reaction) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));

        String userId = reaction.getUserId();
        if (userId == null || userId.trim().isEmpty()) {
            throw new RuntimeException("UserId is required for reaction");
        }
        final String finalUserId = userId.trim();

        return reactionRepository.findByPost_IdAndUserId(postId, finalUserId)
                .map(existing -> {
                    if (existing.getType() == reaction.getType()) {
                        reactionRepository.delete(existing);
                        post.getReactions().remove(existing);
                        return existing;
                    } else {
                        existing.setType(reaction.getType());
                        return reactionRepository.saveAndFlush(existing);
                    }
                })
                .orElseGet(() -> {
                    reaction.setPost(post);
                    reaction.setId(null);
                    reaction.setUserId(finalUserId);
                    reaction.setUsername(reaction.getUsername());
                    Reaction saved = reactionRepository.saveAndFlush(reaction);
                    post.getReactions().add(saved);
                    return saved;
                });
    }

    @Override
    public void deleteReaction(Long id) {
        reactionRepository.deleteById(id);
    }
}
