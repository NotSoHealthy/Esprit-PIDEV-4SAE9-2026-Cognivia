package org.example.forumservice.services;

import org.example.forumservice.entities.Post;
import org.springframework.data.domain.Page;

import java.util.List;

public interface PostService {
    List<Post> getAllPosts(String userId);

    Page<Post> getPosts(String userId, String category, String keyword, int page, int size);

    Post getPostById(Long id);

    Post createPost(Post post);

    Post updatePost(Long id, Post post);

    void deletePost(Long id);

    void reclassifyAllPosts();

    Post togglePin(Long id, String userId);

    Page<Post> getReportedPosts(int page, int size);

    void removeReportsFromPost(Long postId);

    void reportPost(Long postId, String userId);

    Post repostPost(Long postId, String userId, String username);

    java.util.Map<String, Long> getKeywordFrequencies();
}
