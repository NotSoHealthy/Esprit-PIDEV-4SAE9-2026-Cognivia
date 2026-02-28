package org.example.forumservice.repositories;

import org.example.forumservice.entities.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

        @Query("SELECT p FROM Post p " +
                        "LEFT JOIN PinnedPost pp ON p.id = pp.post.id AND pp.userId = :userId " +
                        "WHERE p.banned = false " +
                        "ORDER BY (CASE WHEN pp.id IS NOT NULL THEN 0 ELSE 1 END) ASC, p.createdAt DESC")
        Page<Post> findAllWithPinnedFirst(@Param("userId") String userId, Pageable pageable);

        @Query("SELECT p FROM Post p " +
                        "LEFT JOIN PinnedPost pp ON p.id = pp.post.id AND pp.userId = :userId " +
                        "WHERE p.banned = false AND p.category = :category " +
                        "ORDER BY (CASE WHEN pp.id IS NOT NULL THEN 0 ELSE 1 END) ASC, p.createdAt DESC")
        Page<Post> findByCategoryWithPinnedFirst(@Param("userId") String userId, @Param("category") String category,
                        Pageable pageable);

        @Query("SELECT p FROM Post p " +
                        "LEFT JOIN PinnedPost pp ON p.id = pp.post.id AND pp.userId = :userId " +
                        "JOIN p.keywords k " +
                        "WHERE p.banned = false AND k = :keyword " +
                        "ORDER BY (CASE WHEN pp.id IS NOT NULL THEN 0 ELSE 1 END) ASC, p.createdAt DESC")
        Page<Post> findByKeywordWithPinnedFirst(@Param("userId") String userId, @Param("keyword") String keyword,
                        Pageable pageable);
}
