package org.example.forumservice.repositories;

import org.example.forumservice.entities.Reaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReactionRepository extends JpaRepository<Reaction, Long> {
    List<Reaction> findByPostId(Long postId);

    Optional<Reaction> findByPost_IdAndUserId(Long postId, String userId);

    @Modifying
    @Transactional
    void deleteByPost_IdAndUserId(Long postId, String userId);

    long countByPost_IdAndType(Long postId, org.example.forumservice.entities.ReactionType type);
}
