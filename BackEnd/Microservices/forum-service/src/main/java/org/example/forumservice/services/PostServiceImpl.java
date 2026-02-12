package org.example.forumservice.services;

import org.example.forumservice.entities.Post;
import org.example.forumservice.repositories.PostRepository;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;

    public PostServiceImpl(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    @Override
    public List<Post> getAllPosts() {
        return postRepository.findAll();
    }

    @Override
    public Post getPostById(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + id));
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
