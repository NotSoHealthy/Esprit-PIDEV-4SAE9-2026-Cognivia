package org.example.forumservice.repositories;

import org.example.forumservice.entities.PinnedPost;
import org.example.forumservice.entities.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PinnedPostRepository extends JpaRepository<PinnedPost, Long> {
    Optional<PinnedPost> findByPostAndUserId(Post post, String userId);

    List<PinnedPost> findByUserId(String userId);

    void deleteByPostAndUserId(Post post, String userId);
}
