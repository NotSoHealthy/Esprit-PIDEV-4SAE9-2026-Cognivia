package org.example.forumservice.services;

import org.example.forumservice.entities.Post;

import java.util.List;

public interface PostService {
    List<Post> getAllPosts(String userId);

    Post getPostById(Long id);

    Post createPost(Post post);

    Post updatePost(Long id, Post post);

    void deletePost(Long id);

    Post togglePin(Long id, String userId);

    void reportPost(Long postId, String userId);
}
