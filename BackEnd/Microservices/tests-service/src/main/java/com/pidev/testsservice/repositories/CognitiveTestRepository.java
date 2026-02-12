package com.pidev.testsservice.repositories;

import com.pidev.testsservice.entities.CognitiveTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CognitiveTestRepository extends JpaRepository<CognitiveTest, Long> {
}
