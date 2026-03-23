package com.pidev.pharmacy.repositories;

import com.pidev.pharmacy.entities.AgentLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AgentLogRepository extends JpaRepository<AgentLog, Long> {
    List<AgentLog> findAllByOrderByTimestampDesc();
}
