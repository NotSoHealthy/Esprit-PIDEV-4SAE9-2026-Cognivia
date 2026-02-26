package org.example.forumservice.services;

import org.example.forumservice.entities.Post;
import org.springframework.data.domain.Page;

import java.util.List;

public interface PostService {
    List<Post> getAllPosts(String userId);

    Page<Post> getPosts(String userId, String category, int page, int size);

    Post getPostById(Long id);

    Post createPost(Post post);

    Post updatePost(Long id, Post post);

    void deletePost(Long id);

    Post togglePin(Long id, String userId);

    void reportPost(Long postId, String userId);
}
