package com.pidev.games.repositories;

import com.pidev.games.entities.RecallGameResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecallGameRepository extends JpaRepository<RecallGameResult, Long> {
    List<RecallGameResult> findByPatientId(String patientId);
}
