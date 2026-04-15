package com.pidev.games.repositories;

import com.pidev.games.entities.MemoryGameResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MemoryGameResultRepository extends JpaRepository<MemoryGameResult, Long> {
    List<MemoryGameResult> findByPatientIdOrderByPlayedAtDesc(String patientId);
}
