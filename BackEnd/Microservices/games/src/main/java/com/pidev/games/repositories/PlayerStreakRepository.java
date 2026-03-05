package com.pidev.games.repositories;

import com.pidev.games.entities.PlayerStreak;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlayerStreakRepository extends JpaRepository<PlayerStreak, Long> {
    Optional<PlayerStreak> findByPatientId(String patientId);
}
