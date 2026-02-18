package org.example.forumservice.services;

import org.example.forumservice.entities.Post;
import org.example.forumservice.repositories.PostRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final org.example.forumservice.repositories.ReactionRepository reactionRepository;

    public PostServiceImpl(PostRepository postRepository,
            org.example.forumservice.repositories.ReactionRepository reactionRepository) {
        this.postRepository = postRepository;
        this.reactionRepository = reactionRepository;
    }

    @Override
    public List<Post> getAllPosts() {
        List<Post> posts = postRepository.findAll();
        posts.forEach(this::populateCounts);
        return posts;
    }

    @Override
    public Post getPostById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + id));
        populateCounts(post);
        return post;
    }

    private void populateCounts(Post post) {
        post.setLikeCount(reactionRepository.countByPostIdAndType(post.getId(),
                org.example.forumservice.entities.ReactionType.LIKE));
        post.setDislikeCount(reactionRepository.countByPostIdAndType(post.getId(),
                org.example.forumservice.entities.ReactionType.DISLIKE));
    }

    @Override
    public Post createPost(Post post) {
        // Ensure the ID is null so that Hibernate treats it as a new entity
        post.setId(null);
        return postRepository.save(post);
    }

    @Override
    public Post updatePost(Long id, Post post) {
        Post existing = getPostById(id);
        existing.setTitle(post.getTitle());
        existing.setContent(post.getContent());
        return postRepository.save(existing);
    }

    @Override
    public void deletePost(Long id) {
        postRepository.deleteById(id);
    }
}
