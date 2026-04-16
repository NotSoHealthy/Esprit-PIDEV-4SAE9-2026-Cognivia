package com.pidev.games.repositories;

import com.pidev.games.entities.GameProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GameProfileRepository extends JpaRepository<GameProfile, Long> {
    Optional<GameProfile> findByPatientId(String patientId);
}
