package org.example.forumservice.repositories;

import org.example.forumservice.entities.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReportRepository extends JpaRepository<Report, Long> {
    long countByPost_Id(Long postId);

    boolean existsByPost_IdAndUserId(Long postId, String userId);

    void deleteByPost_Id(Long postId);
}
