package org.example.dpchat.repositories;

import org.example.dpchat.entities.ChatReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatReportRepository extends JpaRepository<ChatReport, Long> {
    List<ChatReport> findByStatus(String status);
}
