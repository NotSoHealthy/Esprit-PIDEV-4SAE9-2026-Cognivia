package com.pidev.monitoring.repositories;

import com.pidev.monitoring.entities.CognitiveTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CognitiveTestRepository extends JpaRepository<CognitiveTest, Long> {
}
